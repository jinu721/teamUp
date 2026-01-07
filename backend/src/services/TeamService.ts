import { Types } from 'mongoose';
import {
  ITeam,
  CreateTeamDTO,
  UpdateTeamDTO
} from '../types';
import { TeamRepository } from '../repositories/TeamRepository';
import { MembershipRepository } from '../repositories/MembershipRepository';
import { WorkshopRepository } from '../repositories/WorkshopRepository';
import { AuditService } from './AuditService';
import { PermissionService } from './PermissionService';
import { ChatService } from './ChatService';
import { SocketService } from './SocketService';
import { NotFoundError, AuthorizationError, ValidationError } from '../utils/errors';

/**
 * Helper to extract ID from a potentially populated reference
 */
function getIdString(ref: Types.ObjectId | { _id: Types.ObjectId } | any): string {
  if (ref && typeof ref === 'object' && '_id' in ref) {
    return ref._id.toString();
  }
  return ref.toString();
}

/**
 * Team Service
 * Handles all team-related business logic including:
 * - Team CRUD operations
 * - Member management
 * - Internal role assignment
 */
export class TeamService {
  private teamRepository: TeamRepository;
  private membershipRepository: MembershipRepository;
  private workshopRepository: WorkshopRepository;
  private auditService: AuditService;
  private permissionService: PermissionService;
  private chatService: ChatService;
  private socketService?: SocketService;

  constructor() {
    this.teamRepository = new TeamRepository();
    this.membershipRepository = new MembershipRepository();
    this.workshopRepository = new WorkshopRepository();
    this.auditService = new AuditService();
    this.permissionService = PermissionService.getInstance();
    this.chatService = new ChatService();
  }

  setSocketService(socketService: SocketService): void {
    this.socketService = socketService;
    this.chatService.setSocketService(socketService);
  }

  /**
   * Create a new team in a workshop
   */
  async createTeam(
    workshopId: string,
    actorId: string,
    data: CreateTeamDTO
  ): Promise<ITeam> {
    // Check permission - only owner or manager or user with permission can create teams
    const permission = await this.permissionService.checkPermission(actorId, workshopId, 'create', 'team');
    if (!permission.granted) {
      await this.auditService.logUnauthorizedAccess(workshopId, actorId, 'create', 'team');
      throw new AuthorizationError(permission.reason || 'Insufficient permissions to create teams');
    }

    const team = await this.teamRepository.create(workshopId, data);

    // Log the creation
    await this.auditService.logTeamCreated(
      workshopId,
      actorId,
      team._id.toString(),
      data.name
    );
    if (this.socketService) this.socketService.emitToWorkshop(workshopId, 'workshop:team:created', team);
    return team;
  }

  /**
   * Get team by ID
   */
  async getTeam(teamId: string): Promise<ITeam> {
    const team = await this.teamRepository.findById(teamId);
    if (!team) {
      throw new NotFoundError('Team');
    }
    return team;
  }

  /**
   * Get all teams in a workshop
   */
  async getWorkshopTeams(workshopId: string): Promise<ITeam[]> {
    return await this.teamRepository.findByWorkshop(workshopId);
  }

  /**
   * Get teams a user belongs to in a workshop
   */
  async getUserTeamsInWorkshop(workshopId: string, userId: string): Promise<ITeam[]> {
    return await this.teamRepository.findByMemberInWorkshop(workshopId, userId);
  }

  /**
   * Update team
   */
  async updateTeam(
    teamId: string,
    actorId: string,
    updates: UpdateTeamDTO
  ): Promise<ITeam> {
    const team = await this.getTeam(teamId);
    const workshopId = getIdString(team.workshop);

    // Check permission
    const permission = await this.permissionService.checkPermission(actorId, workshopId, 'update', 'team', { teamId });
    if (!permission.granted) {
      await this.auditService.logUnauthorizedAccess(workshopId, actorId, 'update', 'team');
      throw new AuthorizationError(permission.reason || 'Insufficient permissions to update teams');
    }

    const updated = await this.teamRepository.update(teamId, updates);

    // Log the update
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

  /**
   * Delete team
   */
  async deleteTeam(teamId: string, actorId: string): Promise<void> {
    const team = await this.getTeam(teamId);
    const workshopId = getIdString(team.workshop);

    // Check permission
    const canDelete = await this.workshopRepository.isOwnerOrManager(workshopId, actorId);
    if (!canDelete) {
      await this.auditService.logUnauthorizedAccess(workshopId, actorId, 'delete', 'team');
      throw new AuthorizationError('Only workshop owner or managers can delete teams');
    }

    await this.teamRepository.delete(teamId);
    await this.chatService.deleteRoomsByEntity('team', teamId);

    // Log the deletion
    await this.auditService.log({
      workshopId,
      action: 'team_deleted' as any,
      actorId,
      targetId: teamId,
      targetType: 'Team',
      details: { teamName: team.name }
    });

    if (this.socketService) this.socketService.emitToWorkshop(workshopId, 'workshop:team:deleted', { teamId });

    // Invalidate permission cache for all team members
    for (const memberId of team.members) {
      this.permissionService.invalidateUserCache(memberId.toString(), workshopId);
    }
  }

  /**
   * Add member to team
   * User must be an active workshop member
   */
  async addMemberToTeam(
    teamId: string,
    actorId: string,
    userId: string
  ): Promise<ITeam> {
    const team = await this.getTeam(teamId);
    const workshopId = getIdString(team.workshop);

    // Check permission
    const canManage = await this.workshopRepository.isOwnerOrManager(workshopId, actorId);
    if (!canManage) {
      await this.auditService.logUnauthorizedAccess(workshopId, actorId, 'add_member', 'team');
      throw new AuthorizationError('Only workshop owner or managers can add team members');
    }

    // Verify user is an active workshop member
    const membership = await this.membershipRepository.findActive(workshopId, userId);
    if (!membership) {
      throw new ValidationError('User must be an active workshop member to join a team');
    }

    // Check if already a member
    const isMember = await this.teamRepository.isMember(teamId, userId);
    if (isMember) {
      throw new ValidationError('User is already a team member');
    }

    const updated = await this.teamRepository.addMember(teamId, userId);

    // Log the addition
    await this.auditService.logTeamMemberAdded(workshopId, actorId, teamId, userId);

    // Invalidate permission cache
    this.permissionService.invalidateUserCache(userId, workshopId);

    // Sync chat rooms
    await this.chatService.syncUserToWorkshopRooms(userId, workshopId);

    if (this.socketService) this.socketService.emitToWorkshop(workshopId, 'workshop:team:member:added', { teamId, userId });

    return updated;
  }

  /**
   * Remove member from team
   */
  async removeMemberFromTeam(
    teamId: string,
    actorId: string,
    userId: string
  ): Promise<ITeam> {
    const team = await this.getTeam(teamId);
    const workshopId = getIdString(team.workshop);

    // Check permission - owner/manager can remove anyone, members can remove themselves
    const canManage = await this.workshopRepository.isOwnerOrManager(workshopId, actorId);
    const isSelf = actorId === userId;

    if (!canManage && !isSelf) {
      await this.auditService.logUnauthorizedAccess(workshopId, actorId, 'remove_member', 'team');
      throw new AuthorizationError('Only workshop owner, managers, or the member themselves can remove from team');
    }

    const updated = await this.teamRepository.removeMember(teamId, userId);

    // Log the removal
    await this.auditService.logTeamMemberRemoved(workshopId, actorId, teamId, userId);

    // Invalidate permission cache
    this.permissionService.invalidateUserCache(userId, workshopId);

    // Sync chat rooms
    await this.chatService.syncUserToWorkshopRooms(userId, workshopId);

    if (this.socketService) this.socketService.emitToWorkshop(workshopId, 'workshop:team:member:removed', { teamId, userId });

    return updated;
  }

  /**
   * Assign internal role to a team member
   */
  async assignInternalRole(
    teamId: string,
    actorId: string,
    userId: string,
    roleName: string
  ): Promise<ITeam> {
    const team = await this.getTeam(teamId);
    const workshopId = getIdString(team.workshop);

    // Check permission
    const canManage = await this.workshopRepository.isOwnerOrManager(workshopId, actorId);
    if (!canManage) {
      await this.auditService.logUnauthorizedAccess(workshopId, actorId, 'assign_role', 'team');
      throw new AuthorizationError('Only workshop owner or managers can assign internal roles');
    }

    // Verify user is a team member
    const isMember = await this.teamRepository.isMember(teamId, userId);
    if (!isMember) {
      throw new ValidationError('User must be a team member to be assigned an internal role');
    }

    const updated = await this.teamRepository.assignInternalRole(teamId, roleName, userId);

    // Log the assignment
    await this.auditService.log({
      workshopId,
      action: 'role_assigned' as any,
      actorId,
      targetId: userId,
      targetType: 'User',
      details: { teamId, roleName, scope: 'team_internal' }
    });

    // Invalidate permission cache
    this.permissionService.invalidateUserCache(userId, workshopId);

    if (this.socketService) this.socketService.emitToWorkshop(workshopId, 'workshop:team:role:assigned', { teamId, userId, roleName });

    return updated;
  }

  /**
   * Remove internal role from a team member
   */
  async removeInternalRole(
    teamId: string,
    actorId: string,
    userId: string,
    roleName: string
  ): Promise<ITeam> {
    const team = await this.getTeam(teamId);
    const workshopId = getIdString(team.workshop);

    // Check permission
    const canManage = await this.workshopRepository.isOwnerOrManager(workshopId, actorId);
    if (!canManage) {
      await this.auditService.logUnauthorizedAccess(workshopId, actorId, 'remove_role', 'team');
      throw new AuthorizationError('Only workshop owner or managers can remove internal roles');
    }

    const updated = await this.teamRepository.removeInternalRole(teamId, roleName, userId);

    // Log the removal
    await this.auditService.log({
      workshopId,
      action: 'role_revoked' as any,
      actorId,
      targetId: userId,
      targetType: 'User',
      details: { teamId, roleName, scope: 'team_internal' }
    });

    // Invalidate permission cache
    this.permissionService.invalidateUserCache(userId, workshopId);

    if (this.socketService) this.socketService.emitToWorkshop(workshopId, 'workshop:team:role:removed', { teamId, userId, roleName });

    return updated;
  }

  /**
   * Check if user is a team member
   */
  async isMember(teamId: string, userId: string): Promise<boolean> {
    return await this.teamRepository.isMember(teamId, userId);
  }

  /**
   * Get team member count
   */
  async getMemberCount(teamId: string): Promise<number> {
    return await this.teamRepository.countMembers(teamId);
  }
}
