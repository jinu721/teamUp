import { Types } from 'mongoose';
import {
  IWorkshopProject,
  CreateWorkshopProjectDTO,
  UpdateWorkshopProjectDTO
} from '../types';
import { WorkshopProjectRepository } from '../repositories/WorkshopProjectRepository';
import { WorkshopRepository } from '../repositories/WorkshopRepository';
import { TeamRepository } from '../repositories/TeamRepository';
import { AuditService } from './AuditService';
import { PermissionService } from './PermissionService';
import { NotFoundError, AuthorizationError } from '../utils/errors';
import { AuditAction } from '../types';
import { ChatService } from './ChatService';
import { SocketService } from './SocketService';

function getIdString(ref: Types.ObjectId | { _id: Types.ObjectId } | any): string {
  if (ref && typeof ref === 'object' && '_id' in ref) {
    return ref._id.toString();
  }
  return ref?.toString() || '';
}

export class WorkshopProjectService {
  private projectRepository: WorkshopProjectRepository;
  private workshopRepository: WorkshopRepository;
  private teamRepository: TeamRepository;
  private auditService: AuditService;
  private permissionService: PermissionService;
  private chatService: ChatService;
  private socketService?: SocketService;

  constructor() {
    this.projectRepository = new WorkshopProjectRepository();
    this.workshopRepository = new WorkshopRepository();
    this.teamRepository = new TeamRepository();
    this.auditService = new AuditService();
    this.permissionService = PermissionService.getInstance();
    this.chatService = new ChatService();
  }

  setSocketService(socketService: SocketService): void {
    this.socketService = socketService;
    this.chatService.setSocketService(socketService);
  }

  async createProject(
    workshopId: string,
    actorId: string,
    data: CreateWorkshopProjectDTO
  ): Promise<IWorkshopProject> {
    const permission = await this.permissionService.checkPermission(actorId, workshopId, 'create', 'project');
    if (!permission.granted) {
      throw new AuthorizationError(permission.reason || 'Insufficient permissions to create projects');
    }

    const project = await this.projectRepository.create(workshopId, data);
    await this.auditService.logProjectCreated(workshopId, actorId, project._id.toString(), data.name);
    if (this.socketService) this.socketService.emitToWorkshop(workshopId, 'workshop:project:created', project);
    return project;
  }

  async getProject(projectId: string): Promise<IWorkshopProject> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) throw new NotFoundError('Project');
    return project;
  }

  async getWorkshopProjects(workshopId: string): Promise<IWorkshopProject[]> {
    return await this.projectRepository.findByWorkshop(workshopId);
  }

  async getUserAccessibleProjects(workshopId: string, userId: string): Promise<IWorkshopProject[]> {
    const teams = await this.teamRepository.findByMemberInWorkshop(workshopId, userId);
    const teamIds = teams.map(t => t._id.toString());
    return await this.projectRepository.findAccessibleByUser(workshopId, userId, teamIds);
  }

  async updateProject(
    projectId: string,
    actorId: string,
    updates: UpdateWorkshopProjectDTO
  ): Promise<IWorkshopProject> {
    const project = await this.getProject(projectId);
    const workshopId = getIdString(project.workshop);

    const permission = await this.permissionService.checkPermission(actorId, workshopId, 'update', 'project', { projectId });
    if (!permission.granted) throw new AuthorizationError(permission.reason || 'Insufficient permissions to update project');

    const updated = await this.projectRepository.update(projectId, updates);
    await this.auditService.log({
      workshopId,
      action: AuditAction.PROJECT_UPDATED,
      actorId,
      targetId: projectId,
      targetType: 'Project',
      details: updates as any
    });

    if (this.socketService) this.socketService.emitToWorkshop(workshopId, 'workshop:project:updated', updated);

    return updated;
  }

  async deleteProject(projectId: string, actorId: string): Promise<void> {
    const project = await this.getProject(projectId);
    const workshopId = getIdString(project.workshop);

    const permission = await this.permissionService.checkPermission(actorId, workshopId, 'delete', 'project', { projectId });
    if (!permission.granted) throw new AuthorizationError(permission.reason || 'Insufficient permissions to delete project');

    await this.projectRepository.delete(projectId);
    await this.chatService.deleteRoomsByEntity('project', projectId);
    await this.auditService.log({
      workshopId,
      action: AuditAction.PROJECT_DELETED,
      actorId,
      targetId: projectId,
      targetType: 'Project',
      details: { projectName: project.name }
    });

    if (this.socketService) this.socketService.emitToWorkshop(workshopId, 'workshop:project:deleted', { projectId });
  }

  async assignTeamToProject(projectId: string, actorId: string, teamId: string): Promise<IWorkshopProject> {
    const project = await this.getProject(projectId);
    const workshopId = getIdString(project.workshop);

    const canManage = await this.canManageProject(workshopId, projectId, actorId);
    if (!canManage) throw new AuthorizationError('You do not have permission to assign teams to this project');

    const updated = await this.projectRepository.assignTeam(projectId, teamId);

    const team = await this.teamRepository.findById(teamId);
    if (team) {
      for (const mId of team.members) {
        const memberId = mId.toString();
        this.permissionService.invalidateUserCache(memberId, workshopId);
        await this.chatService.syncUserToWorkshopRooms(memberId, workshopId);
      }
    }

    if (this.socketService) this.socketService.emitToWorkshop(workshopId, 'workshop:project:team:assigned', updated);

    return updated;
  }

  async removeTeamFromProject(projectId: string, actorId: string, teamId: string): Promise<IWorkshopProject> {
    const project = await this.getProject(projectId);
    const workshopId = getIdString(project.workshop);

    if (!(await this.canManageProject(workshopId, projectId, actorId))) {
      throw new AuthorizationError('No permission');
    }

    const updated = await this.projectRepository.removeTeam(projectId, teamId);

    const team = await this.teamRepository.findById(teamId);
    if (team) {
      for (const mId of team.members) {
        const memberId = mId.toString();
        this.permissionService.invalidateUserCache(memberId, workshopId);
        await this.chatService.syncUserToWorkshopRooms(memberId, workshopId);
      }
    }

    if (this.socketService) this.socketService.emitToWorkshop(workshopId, 'workshop:project:team:removed', updated);

    return updated;
  }

  async assignIndividualToProject(projectId: string, actorId: string, userId: string): Promise<IWorkshopProject> {
    const project = await this.getProject(projectId);
    const workshopId = getIdString(project.workshop);

    if (!(await this.canManageProject(workshopId, projectId, actorId))) {
      throw new AuthorizationError('No permission');
    }

    const updated = await this.projectRepository.assignIndividual(projectId, userId);
    this.permissionService.invalidateUserCache(userId, workshopId);
    await this.chatService.syncUserToWorkshopRooms(userId, workshopId);
    if (this.socketService) this.socketService.emitToWorkshop(workshopId, 'workshop:project:individual:assigned', updated);
    return updated;
  }

  async removeIndividualFromProject(projectId: string, actorId: string, userId: string): Promise<IWorkshopProject> {
    const project = await this.getProject(projectId);
    const workshopId = getIdString(project.workshop);

    if (!(await this.canManageProject(workshopId, projectId, actorId))) {
      throw new AuthorizationError('No permission');
    }

    const updated = await this.projectRepository.removeIndividual(projectId, userId);
    this.permissionService.invalidateUserCache(userId, workshopId);
    await this.chatService.syncUserToWorkshopRooms(userId, workshopId);
    if (this.socketService) this.socketService.emitToWorkshop(workshopId, 'workshop:project:individual:removed', updated);
    return updated;
  }

  async assignProjectManager(projectId: string, actorId: string, userId: string): Promise<IWorkshopProject> {
    const project = await this.getProject(projectId);
    const workshopId = getIdString(project.workshop);

    if (!(await this.workshopRepository.isOwnerOrManager(workshopId, actorId))) {
      throw new AuthorizationError('Only workshop managers can assign project managers');
    }

    const updated = await this.projectRepository.assignProjectManager(projectId, userId);
    this.permissionService.invalidateUserCache(userId, workshopId);
    await this.chatService.syncUserToWorkshopRooms(userId, workshopId);

    await this.auditService.log({
      workshopId,
      action: AuditAction.PROJECT_MANAGER_ASSIGNED,
      actorId,
      targetId: projectId,
      targetType: 'Project',
      details: { managerId: userId }
    });

    if (this.socketService) this.socketService.emitToWorkshop(workshopId, 'workshop:project:manager:assigned', updated);

    return updated;
  }

  async addMaintainer(projectId: string, actorId: string, userId: string): Promise<IWorkshopProject> {
    const project = await this.getProject(projectId);
    const workshopId = getIdString(project.workshop);

    if (!(await this.canManageProject(workshopId, projectId, actorId))) {
      throw new AuthorizationError('No permission');
    }

    const updated = await this.projectRepository.addMaintainer(projectId, userId);
    this.permissionService.invalidateUserCache(userId, workshopId);
    await this.chatService.syncUserToWorkshopRooms(userId, workshopId);

    await this.auditService.log({
      workshopId,
      action: AuditAction.PROJECT_MAINTAINER_ASSIGNED,
      actorId,
      targetId: projectId,
      targetType: 'Project',
      details: { maintainerId: userId }
    });

    if (this.socketService) this.socketService.emitToWorkshop(workshopId, 'workshop:project:maintainer:assigned', updated);

    return updated;
  }

  async removeMaintainer(projectId: string, actorId: string, userId: string): Promise<IWorkshopProject> {
    const project = await this.getProject(projectId);
    const workshopId = getIdString(project.workshop);

    if (!(await this.canManageProject(workshopId, projectId, actorId))) {
      throw new AuthorizationError('No permission');
    }

    const updated = await this.projectRepository.removeMaintainer(projectId, userId);
    this.permissionService.invalidateUserCache(userId, workshopId);
    await this.chatService.syncUserToWorkshopRooms(userId, workshopId);
    if (this.socketService) this.socketService.emitToWorkshop(workshopId, 'workshop:project:maintainer:removed', updated);
    return updated;
  }

  private async canManageProject(workshopId: string, projectId: string, userId: string): Promise<boolean> {
    const res = await this.permissionService.checkPermission(userId, workshopId, 'manage', 'project', { projectId });
    return res.granted;
  }

  async hasAccess(projectId: string, userId: string): Promise<boolean> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) return false;
    const workshopId = getIdString(project.workshop);

    const res = await this.permissionService.checkPermission(userId, workshopId, 'view', 'project', { projectId });
    return res.granted;
  }
}