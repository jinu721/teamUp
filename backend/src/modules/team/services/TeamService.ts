import { Types } from 'mongoose';
import { ITeam, CreateTeamDTO, UpdateTeamDTO } from '../types/index';
import { ITeamRepository } from '../interfaces/ITeamRepository';
import { IMembershipRepository } from '../interfaces/IMembershipRepository';
import { IWorkshopRepository } from '../../workshop/interfaces/IWorkshopRepository';
import { IAuditService } from '../../audit/interfaces/IAuditService';
import { IPermissionService } from '../../access-control/interfaces/IPermissionService';
import { IChatService } from '../../chat/interfaces/IChatService';
import { ISocketService } from '../../../shared/interfaces/ISocketService';
import { ITeamService } from '../interfaces/ITeamService';
import { NotFoundError, AuthorizationError, ValidationError } from '../../../shared/utils/errors';

function getIdString(ref: Types.ObjectId | { _id: Types.ObjectId } | any): string {
  if (ref && typeof ref === 'object' && '_id' in ref) {
    return ref._id.toString();
  }
  return ref.toString();
}

export class TeamService implements ITeamService {
  constructor(
    private teamRepository: ITeamRepository,
    private membershipRepository: IMembershipRepository,
    private workshopRepository: IWorkshopRepository,
    private auditService: IAuditService,
    private permissionService: IPermissionService,
    private chatService: IChatService,
    private socketService: ISocketService | null = null
  ) { }

  setSocketService(socketService: ISocketService): void {
    this.socketService = socketService;
    this.chatService.setSocketService(socketService);
  }

  async createTeam(
    workshopId: string,
    actorId: string,
    data: CreateTeamDTO
  ): Promise<ITeam> {
    const permission = await this.permissionService.checkPermission(actorId, workshopId, 'create', 'team');
    if (!permission.granted) {
      await this.auditService.logUnauthorizedAccess(workshopId, actorId, 'create', 'team');
      throw new AuthorizationError(permission.reason || 'Insufficient permissions to create teams');
    }

    const team = await this.teamRepository.create(workshopId, data);

    await this.auditService.logTeamCreated(
      workshopId,
      actorId,
      team._id.toString(),
      data.name
    );
    if (this.socketService) this.socketService.emitToWorkshop(workshopId, 'workshop:team:created', team);
    return team;
  }

  async getTeam(teamId: string): Promise<ITeam> {
    const team = await this.teamRepository.findById(teamId);
    if (!team) {
      throw new NotFoundError('Team');
    }
    return team;
  }

  async getWorkshopTeams(workshopId: string): Promise<ITeam[]> {
    return await this.teamRepository.findByWorkshop(workshopId);
  }

  async getUserTeamsInWorkshop(workshopId: string, userId: string): Promise<ITeam[]> {
    return await this.teamRepository.findByMemberInWorkshop(workshopId, userId);
  }

  async updateTeam(
    teamId: string,
    actorId: string,
    updates: UpdateTeamDTO
  ): Promise<ITeam> {
    const team = await this.getTeam(teamId);
    const workshopId = getIdString(team.workshop);

    const permission = await this.permissionService.checkPermission(actorId, workshopId, 'update', 'team', { teamId });
    if (!permission.granted) {
      await this.auditService.logUnauthorizedAccess(workshopId, actorId, 'update', 'team');
      throw new AuthorizationError(permission.reason || 'Insufficient permissions to update teams');
    }

    const updated = await this.teamRepository.update(teamId, updates);

    await this.auditService.log({
      workshopId,
      action: 'team_updated' as any,
      actorId,
      targetId: teamId,
      targetType: 'Team',
      details: updates as Record<string, unknown>
    });
    if (this.socketService) this.socketService.emitToWorkshop(workshopId, 'workshop:team:updated', updated);

    return updated;
  }

  async deleteTeam(teamId: string, actorId: string): Promise<void> {
    const team = await this.getTeam(teamId);
    const workshopId = getIdString(team.workshop);

    const canDelete = await this.workshopRepository.isOwnerOrManager(workshopId, actorId);
    if (!canDelete) {
      await this.auditService.logUnauthorizedAccess(workshopId, actorId, 'delete', 'team');
      throw new AuthorizationError('Only workshop owner or managers can delete teams');
    }

    await this.teamRepository.delete(teamId);
    await this.chatService.deleteRoomsByEntity('team', teamId);

    await this.auditService.log({
      workshopId,
      action: 'team_deleted' as any,
      actorId,
      targetId: teamId,
      targetType: 'Team',
      details: { teamName: team.name }
    });

    if (this.socketService) this.socketService.emitToWorkshop(workshopId, 'workshop:team:deleted', { teamId });

    for (const memberId of team.members) {
      this.permissionService.invalidateUserCache(memberId.toString(), workshopId);
    }
  }

  async addMemberToTeam(
    teamId: string,
    actorId: string,
    userId: string
  ): Promise<ITeam> {
    const team = await this.getTeam(teamId);
    const workshopId = getIdString(team.workshop);

    const canManage = await this.workshopRepository.isOwnerOrManager(workshopId, actorId);
    if (!canManage) {
      await this.auditService.logUnauthorizedAccess(workshopId, actorId, 'add_member', 'team');
      throw new AuthorizationError('Only workshop owner or managers can add team members');
    }

    const membership = await this.membershipRepository.findActive(workshopId, userId);
    if (!membership) {
      throw new ValidationError('User must be an active workshop member to join a team');
    }

    const isMember = await this.teamRepository.isMember(teamId, userId);
    if (isMember) {
      throw new ValidationError('User is already a team member');
    }

    const updated = await this.teamRepository.addMember(teamId, userId);

    await this.auditService.logTeamMemberAdded(workshopId, actorId, teamId, userId);

    this.permissionService.invalidateUserCache(userId, workshopId);

    await this.chatService.syncUserToWorkshopRooms(userId, workshopId);

    if (this.socketService) this.socketService.emitToWorkshop(workshopId, 'workshop:team:member:added', { teamId, userId });

    return updated;
  }

  async removeMemberFromTeam(
    teamId: string,
    actorId: string,
    userId: string
  ): Promise<ITeam> {
    const team = await this.getTeam(teamId);
    const workshopId = getIdString(team.workshop);

    const canManage = await this.workshopRepository.isOwnerOrManager(workshopId, actorId);
    const isSelf = actorId === userId;

    if (!canManage && !isSelf) {
      await this.auditService.logUnauthorizedAccess(workshopId, actorId, 'remove_member', 'team');
      throw new AuthorizationError('Only workshop owner, managers, or the member themselves can remove from team');
    }

    const updated = await this.teamRepository.removeMember(teamId, userId);

    await this.auditService.logTeamMemberRemoved(workshopId, actorId, teamId, userId);

    this.permissionService.invalidateUserCache(userId, workshopId);

    await this.chatService.syncUserToWorkshopRooms(userId, workshopId);

    if (this.socketService) this.socketService.emitToWorkshop(workshopId, 'workshop:team:member:removed', { teamId, userId });

    return updated;
  }

  async assignInternalRole(
    teamId: string,
    actorId: string,
    userId: string,
    roleName: string
  ): Promise<ITeam> {
    const team = await this.getTeam(teamId);
    const workshopId = getIdString(team.workshop);

    const canManage = await this.workshopRepository.isOwnerOrManager(workshopId, actorId);
    if (!canManage) {
      await this.auditService.logUnauthorizedAccess(workshopId, actorId, 'assign_role', 'team');
      throw new AuthorizationError('Only workshop owner or managers can assign internal roles');
    }

    const isMember = await this.teamRepository.isMember(teamId, userId);
    if (!isMember) {
      throw new ValidationError('User must be a team member to be assigned an internal role');
    }

    const updated = await this.teamRepository.assignInternalRole(teamId, roleName, userId);

    await this.auditService.log({
      workshopId,
      action: 'role_assigned' as any,
      actorId,
      targetId: userId,
      targetType: 'User',
      details: { teamId, roleName, scope: 'team_internal' }
    });

    this.permissionService.invalidateUserCache(userId, workshopId);

    if (this.socketService) this.socketService.emitToWorkshop(workshopId, 'workshop:team:role:assigned', { teamId, userId, roleName });

    return updated;
  }

  async removeInternalRole(
    teamId: string,
    actorId: string,
    userId: string,
    roleName: string
  ): Promise<ITeam> {
    const team = await this.getTeam(teamId);
    const workshopId = getIdString(team.workshop);

    const canManage = await this.workshopRepository.isOwnerOrManager(workshopId, actorId);
    if (!canManage) {
      await this.auditService.logUnauthorizedAccess(workshopId, actorId, 'remove_role', 'team');
      throw new AuthorizationError('Only workshop owner or managers can remove internal roles');
    }

    const updated = await this.teamRepository.removeInternalRole(teamId, roleName, userId);

    await this.auditService.log({
      workshopId,
      action: 'role_revoked' as any,
      actorId,
      targetId: userId,
      targetType: 'User',
      details: { teamId, roleName, scope: 'team_internal' }
    });

    this.permissionService.invalidateUserCache(userId, workshopId);

    if (this.socketService) this.socketService.emitToWorkshop(workshopId, 'workshop:team:role:removed', { teamId, userId, roleName });

    return updated;
  }

  async isMember(teamId: string, userId: string): Promise<boolean> {
    return await this.teamRepository.isMember(teamId, userId);
  }

  async getMemberCount(teamId: string): Promise<number> {
    return await this.teamRepository.countMembers(teamId);
  }
}