import { IWorkshopTaskRepository, TasksByStatus } from '../interfaces/IWorkshopTaskRepository';
import { IWorkshopProjectRepository } from '../../project/interfaces/IWorkshopProjectRepository';
import { IMembershipRepository } from '../../team/interfaces/IMembershipRepository';
import { ITeamRepository } from '../../team/interfaces/ITeamRepository';
import { INotificationRepository } from '../../notification/interfaces/INotificationRepository';
import { IWorkshopTask, CreateWorkshopTaskDTO, UpdateWorkshopTaskDTO } from '../types/index';
import { IMembership } from '../../team/types/index';
import { NotificationType } from '../../notification/types/index';
import { AuditAction } from '../../audit/types/index';
import { NotFoundError, AuthorizationError, ValidationError } from '../../../shared/utils/errors';
import { ISocketService } from '../../../shared/interfaces/ISocketService';
import { IAuditService } from '../../audit/interfaces/IAuditService';
import { IPermissionService } from '../../access-control/interfaces/IPermissionService';
import { IWorkshopTaskService } from '../interfaces/IWorkshopTaskService';

export class WorkshopTaskService implements IWorkshopTaskService {
  constructor(
    private taskRepo: IWorkshopTaskRepository,
    private projectRepo: IWorkshopProjectRepository,
    private membershipRepo: IMembershipRepository,
    private teamRepo: ITeamRepository,
    private notificationRepo: INotificationRepository,
    private auditService: IAuditService,
    private permissionService: IPermissionService,
    private socketService: ISocketService | null = null
  ) { }

  setSocketService(socketService: ISocketService): void {
    this.socketService = socketService;
  }

  async createTask(
    projectId: string,
    userId: string,
    data: CreateWorkshopTaskDTO
  ): Promise<IWorkshopTask> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project');
    }

    const workshopId = project.workshop.toString();

    const membership = await this.membershipRepo.findActive(workshopId, userId);
    if (!membership) {
      await this.auditService.logUnauthorizedAccess(workshopId, userId, 'create', 'task');
      throw new AuthorizationError('You must be a workshop member to create tasks');
    }

    const hasPermission = await this.permissionService.checkPermission(
      userId,
      workshopId,
      'create',
      'task',
      { projectId }
    );
    if (!hasPermission.granted) {
      await this.auditService.logUnauthorizedAccess(workshopId, userId, 'create', 'task');
      throw new AuthorizationError('Insufficient permissions to create tasks');
    }

    if (!data.title || data.title.trim().length < 3) {
      throw new ValidationError('Task title must be at least 3 characters');
    }

    if (data.parentTask) {
      const parent = await this.taskRepo.findById(data.parentTask);
      if (!parent || parent.project?.toString() !== projectId) {
        throw new ValidationError('Parent task must be in the same project');
      }
    }

    if (data.assignedTeams?.length) {
      for (const teamId of data.assignedTeams) {
        const team = await this.teamRepo.findById(teamId);
        if (!team || team.workshop.toString() !== workshopId) {
          throw new ValidationError(`Team ${teamId} is not in this workshop`);
        }
      }
    }

    const allUsersToValidate = [
      ...(data.assignedIndividuals || []),
      ...(data.contributors || []),
      ...(data.watchers || []),
      ...(data.primaryOwner ? [data.primaryOwner] : [])
    ];

    if (allUsersToValidate.length) {
      for (const uid of [...new Set(allUsersToValidate)]) {
        const isMember = await this.membershipRepo.isActiveMember(workshopId, uid);
        if (!isMember) {
          throw new ValidationError(`User ${uid} is not a workshop member`);
        }
      }
    }

    const task = await this.taskRepo.create(workshopId, projectId, data, userId);

    await this.auditService.log({
      workshopId,
      action: AuditAction.TASK_CREATED,
      actorId: userId,
      targetId: task._id.toString(),
      targetType: 'Task',
      details: {
        title: task.title,
        type: task.type,
        projectId,
        parentTask: data.parentTask,
        primaryOwner: data.primaryOwner
      }
    });

    const notifyUsers = new Set<string>();
    if (data.primaryOwner) notifyUsers.add(data.primaryOwner);
    data.assignedIndividuals?.forEach(id => notifyUsers.add(id));

    for (const notifyId of notifyUsers) {
      if (notifyId !== userId) {
        await this.notificationRepo.create({
          user: notifyId as any,
          type: NotificationType.TASK_ASSIGNED,
          title: 'Advanced Task Assigned',
          message: `You have been assigned to task: ${task.title} as ${data.primaryOwner === notifyId ? 'Primary Owner' : 'Assignee'}`,
          relatedProject: projectId as any,
          relatedWorkshop: project.workshop,
          relatedTask: task._id,
          isRead: false
        } as any);

        if (this.socketService) {
          this.socketService.emitToUser(notifyId, 'notification:new', {
            type: NotificationType.TASK_ASSIGNED,
            title: 'Task Assigned',
            message: `You have been assigned to: ${task.title}`,
            relatedTask: task._id.toString()
          });
        }
      }
    }

    if (data.description) {
      const mentions = await this.extractMentions(workshopId, data.description);
      for (const mentionedId of mentions) {
        if (!notifyUsers.has(mentionedId) && mentionedId !== userId) {
          await this.notificationRepo.create({
            user: mentionedId as any,
            type: NotificationType.COMMENT,
            title: 'Mentioned in Task',
            message: `${(membership.user as any)?.name || 'Someone'} mentioned you in the description of task: ${task.title}`,
            relatedProject: projectId as any,
            relatedWorkshop: project.workshop,
            relatedTask: task._id,
            isRead: false
          } as any);

          if (this.socketService) {
            this.socketService.emitToUser(mentionedId, 'notification:new', {
              type: NotificationType.COMMENT,
              title: 'New Mention',
              message: `You were mentioned in a task description`,
              relatedTask: task._id.toString()
            });
          }
        }
      }
    }

    if (this.socketService) {
      this.socketService.emitToProject(projectId, 'workshop:task:created', task);
    }

    return task;
  }

  async getTaskById(taskId: string, userId: string): Promise<IWorkshopTask> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task');
    }

    const project = task.project as any;
    const workshopId = project.workshop.toString();

    const membership = await this.membershipRepo.findActive(workshopId, userId);
    if (!membership) {
      throw new AuthorizationError('You must be a workshop member to view this task');
    }

    const hasPermission = await this.permissionService.checkPermission(
      userId,
      workshopId,
      'read',
      'task',
      { projectId: project._id.toString() }
    );
    if (!hasPermission.granted) {
      throw new AuthorizationError('Insufficient permissions to view this task');
    }

    return task;
  }

  async getTaskActivities(taskId: string, userId: string): Promise<any[]> {
    const task = await this.getTaskById(taskId, userId);
    return task.activityHistory || [];
  }

  async getProjectTasks(projectId: string, userId: string): Promise<IWorkshopTask[]> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project');
    }

    const workshopId = project.workshop.toString();

    const membership = await this.membershipRepo.findActive(workshopId, userId);
    if (!membership) {
      throw new AuthorizationError('You must be a workshop member to view project tasks');
    }

    const hasPermission = await this.permissionService.checkPermission(
      userId,
      workshopId,
      'read',
      'task',
      { projectId }
    );
    if (!hasPermission.granted) {
      throw new AuthorizationError('Insufficient permissions to view project tasks');
    }

    return await this.taskRepo.findByProject(projectId);
  }

  async getProjectTaskBoard(projectId: string, userId: string): Promise<TasksByStatus> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project');
    }

    const workshopId = project.workshop.toString();

    const membership = await this.membershipRepo.findActive(workshopId, userId);
    if (!membership) {
      throw new AuthorizationError('You must be a workshop member to view project board');
    }

    const hasPermission = await this.permissionService.checkPermission(
      userId,
      workshopId,
      'read',
      'task',
      { projectId }
    );
    if (!hasPermission.granted) {
      throw new AuthorizationError('Insufficient permissions to view project board');
    }

    return await this.taskRepo.findByProjectGroupedByStatus(projectId);
  }

  async updateTask(
    taskId: string,
    userId: string,
    updates: UpdateWorkshopTaskDTO
  ): Promise<IWorkshopTask> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task');
    }

    const project = task.project as any;
    const workshopId = project.workshop.toString();

    const membership = await this.membershipRepo.findActive(workshopId, userId);
    if (!membership) {
      await this.auditService.logUnauthorizedAccess(workshopId, userId, 'update', 'task');
      throw new AuthorizationError('You must be a workshop member to update tasks');
    }

    const hasPermission = await this.permissionService.checkPermission(
      userId,
      workshopId,
      'update',
      'task',
      { projectId: project._id.toString() }
    );
    if (!hasPermission.granted) {
      await this.auditService.logUnauthorizedAccess(workshopId, userId, 'update', 'task');
      throw new AuthorizationError('Insufficient permissions to update this task');
    }

    const oldPrimaryOwner = task.primaryOwner?.toString();
    const oldContributors = new Set(task.contributors?.map((c: any) => typeof c === 'string' ? c : (c as any)._id?.toString() || c.toString()) || []);

    const updatedTask = await this.taskRepo.update(taskId, updates, userId);

    const notifyUsers = new Set<string>();

    if (updates.primaryOwner && updates.primaryOwner !== oldPrimaryOwner) {
      notifyUsers.add(updates.primaryOwner);
    }

    if (updates.contributors) {
      updates.contributors.forEach(uid => {
        if (!oldContributors.has(uid)) {
          notifyUsers.add(uid);
        }
      });
    }

    for (const notifyId of notifyUsers) {
      if (notifyId !== userId) {
        await this.notificationRepo.create({
          user: notifyId as any,
          type: NotificationType.TASK_ASSIGNED,
          title: 'Task Assignment Updated',
          message: `You have been assigned to task: ${updatedTask.title} ${updates.primaryOwner === notifyId ? 'as Primary Owner' : ''}`,
          relatedProject: project._id,
          relatedWorkshop: project.workshop,
          relatedTask: updatedTask._id,
          isRead: false
        } as any);

        if (this.socketService) {
          this.socketService.emitToUser(notifyId, 'notification:new', {
            type: NotificationType.TASK_ASSIGNED,
            title: 'Task Assigned',
            message: `You have been assigned to: ${updatedTask.title}`,
            relatedTask: updatedTask._id.toString()
          });
        }
      }
    }

    if (updates.description && updates.description !== task.description) {
      const mentions = await this.extractMentions(workshopId, updates.description);
      for (const mentionedId of mentions) {
        if (!notifyUsers.has(mentionedId) && mentionedId !== userId) {
          await this.notificationRepo.create({
            user: mentionedId as any,
            type: NotificationType.COMMENT,
            title: 'Mentioned in Task',
            message: `${(membership.user as any)?.name || 'Someone'} mentioned you in the updated description of task: ${updatedTask.title}`,
            relatedProject: project._id,
            relatedWorkshop: project.workshop,
            relatedTask: updatedTask._id,
            isRead: false
          } as any);

          if (this.socketService) {
            this.socketService.emitToUser(mentionedId, 'notification:new', {
              type: NotificationType.COMMENT,
              title: 'New Mention',
              message: `You were mentioned in a task description`,
              relatedTask: updatedTask._id.toString()
            });
          }
        }
      }
    }

    await this.auditService.log({
      workshopId,
      action: AuditAction.TASK_UPDATED,
      actorId: userId,
      targetId: taskId,
      targetType: 'Task',
      details: updates as Record<string, unknown>
    });

    if (this.socketService) {
      this.socketService.emitToProject(project._id.toString(), 'workshop:task:updated', updatedTask);
    }

    return updatedTask;
  }

  async updateTaskStatus(
    taskId: string,
    userId: string,
    newStatus: string
  ): Promise<IWorkshopTask> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task');
    }

    const project = task.project as any;
    const workshopId = project.workshop.toString();

    const membership = await this.membershipRepo.findActive(workshopId, userId);
    if (!membership) {
      await this.auditService.logUnauthorizedAccess(workshopId, userId, 'update', 'task');
      throw new AuthorizationError('You must be a workshop member to update task status');
    }

    const hasPermission = await this.permissionService.checkPermission(
      userId,
      workshopId,
      'update',
      'task',
      { projectId: project._id.toString() }
    );
    if (!hasPermission.granted) {
      await this.auditService.logUnauthorizedAccess(workshopId, userId, 'update', 'task');
      throw new AuthorizationError('Insufficient permissions to update task status');
    }

    const updatedTask = await this.taskRepo.updateStatus(taskId, newStatus, userId);

    await this.auditService.log({
      workshopId,
      action: AuditAction.TASK_STATUS_CHANGED,
      actorId: userId,
      targetId: taskId,
      targetType: 'Task',
      details: { oldStatus: task.status, newStatus }
    });

    if (this.socketService) {
      this.socketService.emitToProject(project._id.toString(), 'workshop:task:status:changed', updatedTask);
    }

    return updatedTask;
  }

  async assignTeamToTask(
    taskId: string,
    userId: string,
    teamId: string
  ): Promise<IWorkshopTask> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task');
    }

    const project = task.project as any;
    const workshopId = project.workshop.toString();

    const membership = await this.membershipRepo.findActive(workshopId, userId);
    if (!membership) {
      await this.auditService.logUnauthorizedAccess(workshopId, userId, 'assign', 'task');
      throw new AuthorizationError('You must be a workshop member to assign tasks');
    }

    const hasPermission = await this.permissionService.checkPermission(
      userId,
      workshopId,
      'assign',
      'task',
      { projectId: project._id.toString() }
    );
    if (!hasPermission.granted) {
      await this.auditService.logUnauthorizedAccess(workshopId, userId, 'assign', 'task');
      throw new AuthorizationError('Insufficient permissions to assign tasks');
    }

    const team = await this.teamRepo.findById(teamId);
    if (!team || team.workshop.toString() !== workshopId) {
      throw new ValidationError('Team is not in this workshop');
    }

    const updatedTask = await this.taskRepo.assignTeam(taskId, teamId, userId);

    await this.auditService.log({
      workshopId,
      action: AuditAction.TASK_ASSIGNED,
      actorId: userId,
      targetId: taskId,
      targetType: 'Task',
      details: { assignedTeam: teamId, teamName: team.name }
    });

    if (this.socketService) {
      this.socketService.emitToProject(project._id.toString(), 'workshop:task:team:assigned', updatedTask);
    }

    return updatedTask;
  }

  async assignIndividualToTask(
    taskId: string,
    userId: string,
    assigneeId: string
  ): Promise<IWorkshopTask> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task');
    }

    const project = task.project as any;
    const workshopId = project.workshop.toString();

    const membership = await this.membershipRepo.findActive(workshopId, userId);
    if (!membership) {
      await this.auditService.logUnauthorizedAccess(workshopId, userId, 'assign', 'task');
      throw new AuthorizationError('You must be a workshop member to assign tasks');
    }

    const hasPermission = await this.permissionService.checkPermission(
      userId,
      workshopId,
      'assign',
      'task',
      { projectId: project._id.toString() }
    );
    if (!hasPermission.granted) {
      await this.auditService.logUnauthorizedAccess(workshopId, userId, 'assign', 'task');
      throw new AuthorizationError('Insufficient permissions to assign tasks');
    }

    const assigneeMembership = await this.membershipRepo.findActive(workshopId, assigneeId);
    if (!assigneeMembership) {
      throw new ValidationError('Assignee must be a workshop member');
    }

    const updatedTask = await this.taskRepo.assignIndividual(taskId, assigneeId, userId);

    await this.auditService.log({
      workshopId,
      action: AuditAction.TASK_ASSIGNED,
      actorId: userId,
      targetId: taskId,
      targetType: 'Task',
      details: { assignedIndividual: assigneeId }
    });

    if (assigneeId !== userId) {
      await this.notificationRepo.create({
        user: assigneeId as any,
        type: NotificationType.TASK_ASSIGNED,
        title: 'Task Assigned',
        message: `You have been assigned to task: ${task.title}`,
        relatedProject: project._id,
        relatedWorkshop: project.workshop,
        relatedTask: task._id,
        isRead: false
      } as any);

      if (this.socketService) {
        this.socketService.emitToUser(assigneeId, 'notification:new', {
          type: NotificationType.TASK_ASSIGNED,
          title: 'Task Assigned',
          message: `You have been assigned to task: ${task.title}`,
          relatedTask: task._id.toString()
        });
      }
    }

    if (this.socketService) {
      this.socketService.emitToProject(project._id.toString(), 'workshop:task:individual:assigned', updatedTask);
    }

    return updatedTask;
  }

  async deleteTask(taskId: string, userId: string): Promise<void> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task');
    }

    const project = task.project as any;
    const workshopId = project.workshop.toString();

    const membership = await this.membershipRepo.findActive(workshopId, userId);
    if (!membership) {
      await this.auditService.logUnauthorizedAccess(workshopId, userId, 'delete', 'task');
      throw new AuthorizationError('You must be a workshop member to delete tasks');
    }

    const hasPermission = await this.permissionService.checkPermission(
      userId,
      workshopId,
      'delete',
      'task',
      { projectId: project._id.toString() }
    );
    if (!hasPermission.granted) {
      await this.auditService.logUnauthorizedAccess(workshopId, userId, 'delete', 'task');
      throw new AuthorizationError('Insufficient permissions to delete this task');
    }

    await this.taskRepo.delete(taskId, userId);

    await this.auditService.log({
      workshopId,
      action: AuditAction.TASK_DELETED,
      actorId: userId,
      targetId: taskId,
      targetType: 'Task',
      details: { title: task.title, type: task.type }
    });

    if (this.socketService) {
      this.socketService.emitToProject(project._id.toString(), 'workshop:task:deleted', {
        taskId,
        projectId: project._id.toString()
      });
    }
  }

  async getUserTasks(userId: string): Promise<IWorkshopTask[]> {
    return await this.taskRepo.findByAssignedUser(userId);
  }

  async getTeamTasks(teamId: string, userId: string): Promise<IWorkshopTask[]> {
    const team = await this.teamRepo.findById(teamId);
    if (!team) {
      throw new NotFoundError('Team');
    }

    const workshopId = team.workshop.toString();

    const membership = await this.membershipRepo.findActive(workshopId, userId);
    if (!membership) {
      throw new AuthorizationError('You must be a workshop member to view team tasks');
    }

    return await this.taskRepo.findByAssignedTeam(teamId);
  }

  async addComment(
    taskId: string,
    userId: string,
    content: string,
    mentions: string[] = []
  ): Promise<IWorkshopTask> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) throw new NotFoundError('Task');

    const project = task.project as any;
    const workshopId = project.workshop.toString();

    const membership = await this.membershipRepo.findActive(workshopId, userId);
    if (!membership) throw new AuthorizationError('You must be a workshop member to comment');

    const updatedTask = await this.taskRepo.addComment(taskId, userId, content, mentions);

    const commenter = await this.membershipRepo.findActive(workshopId, userId);
    const commenterName = (commenter?.user as any)?.name || 'Someone';

    if (mentions.length > 0) {
      for (const mentionedId of mentions) {
        if (mentionedId === userId) continue;

        const isMember = await this.membershipRepo.isActiveMember(workshopId, mentionedId);
        if (!isMember) continue;

        await this.notificationRepo.create({
          user: mentionedId as any,
          type: NotificationType.COMMENT,
          title: 'Mentioned in Comment',
          message: `${commenterName} mentioned you in a comment on task: ${task.title}`,
          relatedProject: project._id,
          relatedWorkshop: project.workshop,
          relatedTask: task._id,
          isRead: false
        } as any);

        if (this.socketService) {
          this.socketService.emitToUser(mentionedId, 'notification:new', {
            type: NotificationType.COMMENT,
            title: 'New Mention',
            message: `${commenterName} mentioned you in a comment`,
            relatedTask: task._id.toString()
          });
        }
      }
    }

    if (this.socketService) {
      this.socketService.emitToProject(project._id.toString(), 'workshop:task:updated', updatedTask);
      this.socketService.emitToProject(project._id.toString(), 'workshop:task:commented', {
        taskId,
        comment: updatedTask.comments[updatedTask.comments.length - 1],
        task: updatedTask
      });
    }

    return updatedTask;
  }

  async addAttachment(
    taskId: string,
    userId: string,
    fileData: { fileName: string; fileUrl: string; fileType: string; fileSize: number }
  ): Promise<IWorkshopTask> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) throw new NotFoundError('Task');

    const project = task.project as any;
    const workshopId = project.workshop.toString();

    const membership = await this.membershipRepo.findActive(workshopId, userId);
    if (!membership) throw new AuthorizationError('You must be a workshop member to upload');

    const updatedTask = await this.taskRepo.addAttachment(taskId, userId, fileData);

    if (this.socketService) {
      this.socketService.emitToProject(project._id.toString(), 'workshop:task:updated', updatedTask);
      this.socketService.emitToProject(project._id.toString(), 'workshop:task:attachment:added', {
        taskId,
        attachment: updatedTask.attachments[updatedTask.attachments.length - 1],
        task: updatedTask
      });
    }

    return updatedTask;
  }

  private async extractMentions(workshopId: string, text: string): Promise<string[]> {
    const mentions: string[] = [];
    const mentionMatches = text.match(/@(\w+)/g);

    if (mentionMatches) {
      const activeMembers = await this.membershipRepo.getActiveMembers(workshopId);
      for (const match of mentionMatches) {
        const name = match.substring(1);
        const member = activeMembers.find((m: IMembership) => {
          const userObj = m.user as any;
          const mName = userObj?.name || '';
          return mName.toLowerCase().includes(name.toLowerCase());
        });
        if (member) {
          const userObj = member.user as any;
          const userId = userObj?._id || userObj;
          if (userId) {
            mentions.push(userId.toString());
          }
        }
      }
    }

    return [...new Set(mentions)];
  }
}