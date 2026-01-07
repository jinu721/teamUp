import { WorkshopTaskRepository, TasksByStatus } from '../repositories/WorkshopTaskRepository';
import { WorkshopProjectRepository } from '../repositories/WorkshopProjectRepository';
import { MembershipRepository } from '../repositories/MembershipRepository';
import { TeamRepository } from '../repositories/TeamRepository';
import { NotificationRepository } from '../repositories/NotificationRepository';
import { IWorkshopTask, CreateWorkshopTaskDTO, UpdateWorkshopTaskDTO, NotificationType, AuditAction } from '../types';
import { NotFoundError, AuthorizationError, ValidationError } from '../utils/errors';
import { SocketService } from './SocketService';
import { AuditService } from './AuditService';
import { PermissionService } from './PermissionService';

/**
 * Workshop Task Service
 * Handles all workshop-aware task management business logic
 */
export class WorkshopTaskService {
  private taskRepo: WorkshopTaskRepository;
  private projectRepo: WorkshopProjectRepository;
  private membershipRepo: MembershipRepository;
  private teamRepo: TeamRepository;
  private notificationRepo: NotificationRepository;
  private auditService: AuditService;
  private permissionService: PermissionService;
  private socketService: SocketService | null = null;

  constructor() {
    this.taskRepo = new WorkshopTaskRepository();
    this.projectRepo = new WorkshopProjectRepository();
    this.membershipRepo = new MembershipRepository();
    this.teamRepo = new TeamRepository();
    this.notificationRepo = new NotificationRepository();
    this.auditService = new AuditService();
    this.permissionService = PermissionService.getInstance();
  }

  setSocketService(socketService: SocketService): void {
    this.socketService = socketService;
  }

  /**
   * Create a new task in a project
   */
  async createTask(
    projectId: string,
    userId: string,
    data: CreateWorkshopTaskDTO
  ): Promise<IWorkshopTask> {
    // Get project and verify it exists
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project');
    }

    const workshopId = project.workshop.toString();

    // Verify user is workshop member
    const membership = await this.membershipRepo.findActive(workshopId, userId);
    if (!membership) {
      await this.auditService.logUnauthorizedAccess(workshopId, userId, 'create', 'task');
      throw new AuthorizationError('You must be a workshop member to create tasks');
    }

    // Check permission to create tasks
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

    // Validate required fields
    if (!data.title || data.title.trim().length < 3) {
      throw new ValidationError('Task title must be at least 3 characters');
    }

    // Validate parent task if provided
    if (data.parentTask) {
      const parent = await this.taskRepo.findById(data.parentTask);
      if (!parent || parent.project?.toString() !== projectId) {
        throw new ValidationError('Parent task must be in the same project');
      }
    }

    // Validate assigned teams are in the workshop
    if (data.assignedTeams?.length) {
      for (const teamId of data.assignedTeams) {
        const team = await this.teamRepo.findById(teamId);
        if (!team || team.workshop.toString() !== workshopId) {
          throw new ValidationError(`Team ${teamId} is not in this workshop`);
        }
      }
    }

    // Validate assigned individuals are workshop members
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

    // Log task creation
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

    // Notify primary owner and assignees
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

    // Emit real-time event
    if (this.socketService) {
      this.socketService.emitToProject(projectId, 'workshop:task:created', task);
    }

    return task;
  }

  /**
   * Get task by ID with permission check
   */
  async getTaskById(taskId: string, userId: string): Promise<IWorkshopTask> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task');
    }

    const project = task.project as any;
    const workshopId = project.workshop.toString();

    // Verify user is workshop member
    const membership = await this.membershipRepo.findActive(workshopId, userId);
    if (!membership) {
      throw new AuthorizationError('You must be a workshop member to view this task');
    }

    // Check read permission
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

  /**
   * Get task activities
   */
  async getTaskActivities(taskId: string, userId: string): Promise<any[]> {
    const task = await this.getTaskById(taskId, userId);
    return task.activityHistory || [];
  }

  /**
   * Get all tasks in a project
   */
  async getProjectTasks(projectId: string, userId: string): Promise<IWorkshopTask[]> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project');
    }

    const workshopId = project.workshop.toString();

    // Verify user is workshop member
    const membership = await this.membershipRepo.findActive(workshopId, userId);
    if (!membership) {
      throw new AuthorizationError('You must be a workshop member to view project tasks');
    }

    // Check read permission
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

  /**
   * Get tasks grouped by status for board view
   */
  async getProjectTaskBoard(projectId: string, userId: string): Promise<TasksByStatus> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project');
    }

    const workshopId = project.workshop.toString();

    // Verify user is workshop member
    const membership = await this.membershipRepo.findActive(workshopId, userId);
    if (!membership) {
      throw new AuthorizationError('You must be a workshop member to view project board');
    }

    // Check read permission
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

  /**
   * Update task
   */
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

    // Verify user is workshop member
    const membership = await this.membershipRepo.findActive(workshopId, userId);
    if (!membership) {
      await this.auditService.logUnauthorizedAccess(workshopId, userId, 'update', 'task');
      throw new AuthorizationError('You must be a workshop member to update tasks');
    }

    // Check update permission
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

    const updatedTask = await this.taskRepo.update(taskId, updates, userId);

    // Log task update
    await this.auditService.log({
      workshopId,
      action: AuditAction.TASK_UPDATED,
      actorId: userId,
      targetId: taskId,
      targetType: 'Task',
      details: updates as Record<string, unknown>
    });

    // Emit real-time event
    if (this.socketService) {
      this.socketService.emitToProject(project._id.toString(), 'workshop:task:updated', updatedTask);
    }

    return updatedTask;
  }

  /**
   * Update task status (for drag-and-drop)
   */
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

    // Verify user is workshop member
    const membership = await this.membershipRepo.findActive(workshopId, userId);
    if (!membership) {
      await this.auditService.logUnauthorizedAccess(workshopId, userId, 'update', 'task');
      throw new AuthorizationError('You must be a workshop member to update task status');
    }

    // Check update permission
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

    // Log status change
    await this.auditService.log({
      workshopId,
      action: AuditAction.TASK_STATUS_CHANGED,
      actorId: userId,
      targetId: taskId,
      targetType: 'Task',
      details: { oldStatus: task.status, newStatus }
    });

    // Emit real-time event
    if (this.socketService) {
      this.socketService.emitToProject(project._id.toString(), 'workshop:task:status:changed', updatedTask);
    }

    return updatedTask;
  }

  /**
   * Assign team to task
   */
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

    // Verify user is workshop member
    const membership = await this.membershipRepo.findActive(workshopId, userId);
    if (!membership) {
      await this.auditService.logUnauthorizedAccess(workshopId, userId, 'assign', 'task');
      throw new AuthorizationError('You must be a workshop member to assign tasks');
    }

    // Check assign permission
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

    // Verify team is in the workshop
    const team = await this.teamRepo.findById(teamId);
    if (!team || team.workshop.toString() !== workshopId) {
      throw new ValidationError('Team is not in this workshop');
    }

    const updatedTask = await this.taskRepo.assignTeam(taskId, teamId, userId);

    // Log team assignment
    await this.auditService.log({
      workshopId,
      action: AuditAction.TASK_ASSIGNED,
      actorId: userId,
      targetId: taskId,
      targetType: 'Task',
      details: { assignedTeam: teamId, teamName: team.name }
    });

    // Emit real-time event
    if (this.socketService) {
      this.socketService.emitToProject(project._id.toString(), 'workshop:task:team:assigned', updatedTask);
    }

    return updatedTask;
  }

  /**
   * Assign individual to task
   */
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

    // Verify user is workshop member
    const membership = await this.membershipRepo.findActive(workshopId, userId);
    if (!membership) {
      await this.auditService.logUnauthorizedAccess(workshopId, userId, 'assign', 'task');
      throw new AuthorizationError('You must be a workshop member to assign tasks');
    }

    // Check assign permission
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

    // Verify assignee is workshop member
    const assigneeMembership = await this.membershipRepo.findActive(workshopId, assigneeId);
    if (!assigneeMembership) {
      throw new ValidationError('Assignee must be a workshop member');
    }

    const updatedTask = await this.taskRepo.assignIndividual(taskId, assigneeId, userId);

    // Log individual assignment
    await this.auditService.log({
      workshopId,
      action: AuditAction.TASK_ASSIGNED,
      actorId: userId,
      targetId: taskId,
      targetType: 'Task',
      details: { assignedIndividual: assigneeId }
    });

    // Notify assignee if different from assigner
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

    // Emit real-time event
    if (this.socketService) {
      this.socketService.emitToProject(project._id.toString(), 'workshop:task:individual:assigned', updatedTask);
    }

    return updatedTask;
  }

  /**
   * Delete task
   */
  async deleteTask(taskId: string, userId: string): Promise<void> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task');
    }

    const project = task.project as any;
    const workshopId = project.workshop.toString();

    // Verify user is workshop member
    const membership = await this.membershipRepo.findActive(workshopId, userId);
    if (!membership) {
      await this.auditService.logUnauthorizedAccess(workshopId, userId, 'delete', 'task');
      throw new AuthorizationError('You must be a workshop member to delete tasks');
    }

    // Check delete permission
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

    // Log task deletion
    await this.auditService.log({
      workshopId,
      action: AuditAction.TASK_DELETED,
      actorId: userId,
      targetId: taskId,
      targetType: 'Task',
      details: { title: task.title, type: task.type }
    });

    // Emit real-time event
    if (this.socketService) {
      this.socketService.emitToProject(project._id.toString(), 'workshop:task:deleted', {
        taskId,
        projectId: project._id.toString()
      });
    }
  }

  /**
   * Get tasks assigned to a user
   */
  async getUserTasks(userId: string): Promise<IWorkshopTask[]> {
    return await this.taskRepo.findByAssignedUser(userId);
  }

  /**
   * Get tasks assigned to a team
   */
  async getTeamTasks(teamId: string, userId: string): Promise<IWorkshopTask[]> {
    const team = await this.teamRepo.findById(teamId);
    if (!team) {
      throw new NotFoundError('Team');
    }

    const workshopId = team.workshop.toString();

    // Verify user is workshop member
    const membership = await this.membershipRepo.findActive(workshopId, userId);
    if (!membership) {
      throw new AuthorizationError('You must be a workshop member to view team tasks');
    }

    return await this.taskRepo.findByAssignedTeam(teamId);
  }

  /**
   * Add a comment to a task
   */
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

    // Verify user is workshop member
    const membership = await this.membershipRepo.findActive(workshopId, userId);
    if (!membership) throw new AuthorizationError('You must be a workshop member to comment');

    const updatedTask = await this.taskRepo.addComment(taskId, userId, content, mentions);

    // Emit real-time event
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

  /**
   * Add an attachment to a task
   */
  async addAttachment(
    taskId: string,
    userId: string,
    fileData: { fileName: string; fileUrl: string; fileType: string; fileSize: number }
  ): Promise<IWorkshopTask> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) throw new NotFoundError('Task');

    const project = task.project as any;
    const workshopId = project.workshop.toString();

    // Verify user is workshop member
    const membership = await this.membershipRepo.findActive(workshopId, userId);
    if (!membership) throw new AuthorizationError('You must be a workshop member to upload');

    const updatedTask = await this.taskRepo.addAttachment(taskId, userId, fileData);

    // Emit real-time event
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
}