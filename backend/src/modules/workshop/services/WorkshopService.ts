import { IWorkshop, CreateWorkshopDTO, UpdateWorkshopDTO } from '../types/index';
import { IMembership, MembershipState, MembershipSource } from '../../team/types/index';
import { AuditAction } from '../../audit/types/index';
import { PermissionScope, PermissionType } from '../../access-control/types/index';

import { IWorkshopRepository } from '../interfaces/IWorkshopRepository';
import { IMembershipRepository } from '../../team/interfaces/IMembershipRepository';
import { ITeamRepository } from '../../team/interfaces/ITeamRepository';
import { IRoleRepository } from '../../access-control/interfaces/IRoleRepository';
import { IRoleAssignmentRepository } from '../../access-control/interfaces/IRoleAssignmentRepository';
import { IWorkshopProjectRepository } from '../../project/interfaces/IWorkshopProjectRepository';
import { IAuditService } from '../../audit/interfaces/IAuditService';
import { IPermissionService } from '../../access-control/interfaces/IPermissionService';
import { ISocketService } from '../../../shared/interfaces/ISocketService';
import { IEmailService } from '../../../shared/interfaces/IEmailService';
import { IChatService } from '../../chat/interfaces/IChatService';
import { IWorkshopService } from '../interfaces/IWorkshopService';
import { NotFoundError, AuthorizationError, ValidationError } from '../../../shared/utils/errors';
import { Types } from 'mongoose';
import { Membership } from '../../team/models/Membership';
import { User } from '../../user/models/User';
import { Invitation } from '../../invitation/models/Invitation';
import { IInvitation } from '../../invitation/types/index';
import crypto from 'crypto';
import { eventBus } from '../../../shared/utils/EventBus';


function getIdString(ref: any): string {
  if (ref && typeof ref === 'object' && '_id' in ref) {
    return ref._id.toString();
  }
  return ref?.toString() || '';
}

export class WorkshopService implements IWorkshopService {
  constructor(
    private workshopRepository: IWorkshopRepository,
    private membershipRepository: IMembershipRepository,
    private teamRepository: ITeamRepository,
    private roleRepository: IRoleRepository,
    private roleAssignmentRepository: IRoleAssignmentRepository,
    private projectRepository: IWorkshopProjectRepository,
    private auditService: IAuditService,
    private permissionService: IPermissionService,
    private emailService: IEmailService,
    private chatService: IChatService,
    private socketService: ISocketService | null = null
  ) { }

  setSocketService(socketService: ISocketService): void {
    this.socketService = socketService;
    this.chatService.setSocketService(socketService);
  }

  async createWorkshop(ownerId: string, data: CreateWorkshopDTO): Promise<IWorkshop> {
    const workshop = await this.workshopRepository.create(ownerId, data);

    await this.membershipRepository.create({
      workshopId: workshop._id.toString(),
      userId: ownerId,
      source: MembershipSource.INVITATION,
      state: MembershipState.ACTIVE
    });

    await this.chatService.syncUserToWorkshopRooms(ownerId, workshop._id.toString());

    await this.createDefaultRoles(workshop._id.toString());

    await this.auditService.logWorkshopCreated(
      workshop._id.toString(),
      ownerId,
      { name: data.name, visibility: data.visibility }
    );

    return await this.workshopRepository.findById(workshop._id.toString()) || workshop;
  }

  private async createDefaultRoles(workshopId: string): Promise<void> {
    const defaultRoles = [
      {
        name: 'Workshop Admin',
        description: 'Full administrative access to the entire workshop',
        scope: PermissionScope.WORKSHOP,
        permissions: [
          { action: '*', resource: '*', type: PermissionType.GRANT }
        ]
      },
      {
        name: 'Project Lead',
        description: 'Manage projects, teams, and tasks',
        scope: PermissionScope.WORKSHOP,
        permissions: [
          { action: 'manage', resource: 'project', type: PermissionType.GRANT },
          { action: 'manage', resource: 'team', type: PermissionType.GRANT },
          { action: 'manage', resource: 'task', type: PermissionType.GRANT },
          { action: 'manage', resource: 'chat_room', type: PermissionType.GRANT },
          { action: 'view', resource: '*', type: PermissionType.GRANT }
        ]
      },
      {
        name: 'Member',
        description: 'Standard member with read/write access to assigned projects',
        scope: PermissionScope.WORKSHOP,
        permissions: [
          { action: 'create', resource: 'task', type: PermissionType.GRANT },
          { action: 'update', resource: 'task', type: PermissionType.GRANT },
          { action: 'create', resource: 'chat_room', type: PermissionType.GRANT },
          { action: 'view', resource: 'project', type: PermissionType.GRANT },
          { action: 'view', resource: 'team', type: PermissionType.GRANT },
          { action: 'view', resource: 'task', type: PermissionType.GRANT }
        ]
      },
      {
        name: 'Viewer',
        description: 'Read-only access to workshop resources',
        scope: PermissionScope.WORKSHOP,
        permissions: [
          { action: 'view', resource: '*', type: PermissionType.GRANT }
        ]
      }
    ];

    for (const roleData of defaultRoles) {
      await this.roleRepository.create(workshopId, roleData);
    }
  }

  async getWorkshop(workshopId: string): Promise<IWorkshop> {
    const workshop = await this.workshopRepository.findById(workshopId);
    if (!workshop) throw new NotFoundError('Workshop');
    return workshop;
  }

  async getUserWorkshops(userId: string): Promise<IWorkshop[]> {
    const ownedOrManaged = await this.workshopRepository.findByUser(userId);
    const memberships = await this.membershipRepository.findByUser(userId, MembershipState.ACTIVE);
    const memberWorkshopIds = memberships.map(m => getIdString(m.workshop));

    const workshopMap = new Map<string, IWorkshop>();
    for (const w of ownedOrManaged) {
      workshopMap.set(w._id.toString(), w);
    }

    for (const workshopId of memberWorkshopIds) {
      if (!workshopMap.has(workshopId)) {
        const workshop = await this.workshopRepository.findById(workshopId);
        if (workshop) workshopMap.set(workshopId, workshop);
      }
    }

    const results = [];
    for (const workshop of Array.from(workshopMap.values())) {
      const memberCount = await this.membershipRepository.countByWorkshop(workshop._id.toString(), MembershipState.ACTIVE);
      results.push({
        ...workshop.toObject(),
        memberCount
      });
    }

    return results;
  }

  async updateWorkshop(workshopId: string, actorId: string, updates: UpdateWorkshopDTO): Promise<IWorkshop> {
    if (!(await this.workshopRepository.isOwnerOrManager(workshopId, actorId))) {
      throw new AuthorizationError('No permission');
    }
    const workshop = await this.workshopRepository.update(workshopId, updates);
    await this.auditService.logWorkshopUpdated(workshopId, actorId, updates as any);
    return workshop;
  }

  async deleteWorkshop(workshopId: string, actorId: string): Promise<void> {
    if (!(await this.workshopRepository.isOwner(workshopId, actorId))) {
      throw new AuthorizationError('Only owner can delete');
    }
    await this.roleAssignmentRepository.deleteByWorkshop(workshopId);
    await this.roleRepository.deleteByWorkshop(workshopId);
    await this.teamRepository.deleteByWorkshop(workshopId);
    await this.projectRepository.deleteByWorkshop(workshopId);
    await this.membershipRepository.deleteByWorkshop(workshopId);
    await this.workshopRepository.delete(workshopId);
    await this.auditService.log({
      workshopId,
      action: AuditAction.WORKSHOP_DELETED,
      actorId,
      targetId: workshopId,
      targetType: 'Workshop'
    });
  }

  async assignManager(workshopId: string, actorId: string, managerId: string): Promise<IWorkshop> {
    if (!(await this.workshopRepository.isOwner(workshopId, actorId))) {
      throw new AuthorizationError('Only owner can assign managers');
    }
    if (actorId === managerId) throw new ValidationError('Cannot assign self');
    const membership = await this.membershipRepository.findActive(workshopId, managerId);
    if (!membership) throw new ValidationError('User must be active member');

    const workshop = await this.workshopRepository.addManager(workshopId, managerId);
    this.permissionService.invalidateUserCache(managerId, workshopId);
    if (this.socketService) this.socketService.emitToWorkshop(workshopId, 'workshop:manager:assigned', { workshopId, managerId, workshop });
    return workshop;
  }

  async removeManager(workshopId: string, actorId: string, managerId: string): Promise<IWorkshop> {
    if (!(await this.workshopRepository.isOwner(workshopId, actorId))) {
      throw new AuthorizationError('No permission');
    }
    const workshop = await this.workshopRepository.removeManager(workshopId, managerId);
    this.permissionService.invalidateUserCache(managerId, workshopId);
    if (this.socketService) this.socketService.emitToWorkshop(workshopId, 'workshop:manager:removed', { workshopId, managerId, workshop });
    return workshop;
  }

  async inviteMember(workshopId: string, actorId: string, invitedEmail: string, roleId?: string): Promise<void> {
    if (!(await this.workshopRepository.isOwnerOrManager(workshopId, actorId))) {
      throw new AuthorizationError('No permission');
    }

    const email = invitedEmail.toLowerCase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const existingMembership = await this.membershipRepository.findByWorkshopAndUser(workshopId, existingUser._id.toString());
      if (existingMembership && existingMembership.state === MembershipState.ACTIVE) {
        throw new ValidationError('User is already a member of this workshop');
      }
    }

    let membership: IMembership | undefined;
    if (existingUser) {
      const existing = await this.membershipRepository.findByWorkshopAndUser(workshopId, existingUser._id.toString());
      if (!existing) {
        membership = await this.membershipRepository.create({
          workshopId,
          userId: existingUser._id.toString(),
          source: MembershipSource.INVITATION,
          invitedBy: actorId,
          state: MembershipState.PENDING
        });
      } else {
        membership = existing;
      }
    }

    const token = crypto.randomBytes(32).toString('hex');

    await Invitation.create({
      token,
      email,
      workshop: new Types.ObjectId(workshopId),
      role: roleId ? new Types.ObjectId(roleId) : undefined,
      invitedBy: new Types.ObjectId(actorId)
    });

    await this.auditService.logMemberInvited(workshopId, actorId, email);

    if (membership && this.socketService) {
      this.socketService.emitToWorkshop(workshopId, 'membership:invited', membership);
    }

    const inviter = await User.findById(actorId);
    const workshop = await this.workshopRepository.findById(workshopId);

    if (inviter && workshop) {
      await this.emailService.sendWorkshopInvitation(
        email,
        inviter.name || 'Admin',
        workshop.name,
        workshopId,
        token
      );
    }
  }

  async acceptInvitationByToken(invitation: IInvitation, userId: string): Promise<IMembership> {
    const workshopId = invitation.workshop.toString();

    const membership = await this.handleJoinRequest(workshopId, userId);

    if (membership.state === MembershipState.PENDING) {
      await this.approveJoinRequest(workshopId, invitation.invitedBy.toString(), membership._id.toString());
    }

    if (invitation.role) {
      const roleId = invitation.role.toString();
      const role = await this.roleRepository.findById(roleId);
      if (role && role.workshop.toString() === workshopId) {
        await this.roleAssignmentRepository.create({
          workshopId,
          roleId,
          userId,
          scope: role.scope,
          scopeId: role.scopeId?.toString(),
          assignedBy: invitation.invitedBy.toString()
        });
      }
    }

    return membership;
  }

  async handleJoinRequest(workshopId: string, userId: string): Promise<IMembership> {
    const workshop = await this.getWorkshop(workshopId);
    const existing = await this.membershipRepository.findByWorkshopAndUser(workshopId, userId);

    if (existing && existing.state === MembershipState.ACTIVE) {
      throw new ValidationError('Already member');
    }

    const autoApprove = !workshop.settings.requireApprovalForJoin;
    const state = autoApprove ? MembershipState.ACTIVE : MembershipState.PENDING;

    let membership: IMembership;
    if (existing) {
      membership = await this.membershipRepository.updateState(
        existing._id.toString(),
        state,
        state === MembershipState.ACTIVE ? userId : undefined
      );

      if (existing.source === MembershipSource.INVITATION && !autoApprove) {
        await Membership.findByIdAndUpdate(existing._id, { $set: { source: MembershipSource.JOIN_REQUEST } });
        membership.source = MembershipSource.JOIN_REQUEST;
      }
    } else {
      membership = await this.membershipRepository.create({
        workshopId,
        userId,
        source: autoApprove ? MembershipSource.OPEN_ACCESS : MembershipSource.JOIN_REQUEST,
        state
      });
    }

    if (state === MembershipState.ACTIVE) {
      this.permissionService.invalidateUserCache(userId, workshopId);
      await this.chatService.syncUserToWorkshopRooms(userId, workshopId);
      if (this.socketService) this.socketService.emitToWorkshop(workshopId, 'membership:joined', membership);

      eventBus.emit('member:joined', {
        workshopId,
        member: membership,
        user: userId
      });
    } else {

      if (this.socketService) this.socketService.emitToWorkshop(workshopId, 'membership:request:created', membership);
    }
    return membership;
  }

  async approveJoinRequest(workshopId: string, actorId: string, membershipId: string): Promise<IMembership> {
    if (!(await this.workshopRepository.isOwnerOrManager(workshopId, actorId))) throw new AuthorizationError('No permission');
    const updated = await this.membershipRepository.updateState(membershipId, MembershipState.ACTIVE, actorId);
    if (updated.user) {
      this.permissionService.invalidateUserCache(getIdString(updated.user), workshopId);
      await this.chatService.syncUserToWorkshopRooms(getIdString(updated.user), workshopId);
      await this.auditService.logJoinRequestApproved(workshopId, actorId, getIdString(updated.user));
    }
    if (this.socketService) this.socketService.emitToWorkshop(workshopId, 'membership:request:approved', updated);

    eventBus.emit('member:joined', {
      workshopId,
      member: updated,
      user: actorId
    });

    return updated;

  }

  async rejectJoinRequest(workshopId: string, actorId: string, membershipId: string, reason?: string): Promise<IMembership> {
    if (!(await this.workshopRepository.isOwnerOrManager(workshopId, actorId))) throw new AuthorizationError('No permission');
    const updated = await this.membershipRepository.updateState(membershipId, MembershipState.REMOVED, actorId);
    if (updated.user) await this.auditService.logJoinRequestRejected(workshopId, actorId, getIdString(updated.user), reason);
    if (this.socketService) this.socketService.emitToWorkshop(workshopId, 'membership:request:rejected', { membershipId });
    return updated;
  }

  async revokeMembership(workshopId: string, actorId: string, userId: string, _reason?: string): Promise<IMembership> {
    if (!(await this.workshopRepository.isOwnerOrManager(workshopId, actorId))) throw new AuthorizationError('No permission');
    const membership = await this.membershipRepository.findActive(workshopId, userId);
    if (!membership) throw new NotFoundError('Active membership');

    const updated = await this.membershipRepository.updateState(membership._id.toString(), MembershipState.REMOVED, actorId);
    const teams = await this.teamRepository.findByMemberInWorkshop(workshopId, userId);
    for (const team of teams) await this.teamRepository.removeMember(team._id.toString(), userId);
    await this.roleAssignmentRepository.deleteByUser(workshopId, userId);

    this.permissionService.invalidateUserCache(userId, workshopId);
    await this.chatService.syncUserToWorkshopRooms(userId, workshopId);
    if (this.socketService) this.socketService.emitToWorkshop(workshopId, 'membership:removed', { membershipId: updated._id.toString() });
    return updated;
  }

  async handleMemberLeave(workshopId: string, userId: string): Promise<void> {
    const membership = await this.membershipRepository.findActive(workshopId, userId);
    if (!membership) throw new NotFoundError('Active membership');
    await this.membershipRepository.updateState(membership._id.toString(), MembershipState.REMOVED, userId);
    this.permissionService.invalidateUserCache(userId, workshopId);
    await this.chatService.syncUserToWorkshopRooms(userId, workshopId);
    if (this.socketService) this.socketService.emitToWorkshop(workshopId, 'membership:left', { membershipId: membership._id.toString() });
  }

  async getMembers(workshopId: string, state?: MembershipState): Promise<any[]> {
    const memberships = await this.membershipRepository.findByWorkshop(workshopId, state);
    const assignments = await this.roleAssignmentRepository.findByWorkshop(workshopId);

    return memberships.map(membership => {
      const user = membership.user as any;
      const userId = user._id?.toString() || user.toString();

      const userRoles = assignments
        .filter(a => (a.user as any)._id?.toString() === userId || (a.user as any).toString() === userId)
        .map(a => a.role);

      return {
        ...membership.toObject(),
        roles: userRoles
      };
    });
  }

  async getPendingRequests(workshopId: string): Promise<IMembership[]> {
    return await this.membershipRepository.findPendingByWorkshop(workshopId);
  }

  async getPublicWorkshops(options?: any, currentUserId?: string): Promise<{ workshops: any[]; total: number; pages: number }> {
    const limit = options?.limit || 20;
    const page = options?.page || 1;
    const skip = (page - 1) * limit;

    const findOptions = { ...options, skip };
    delete findOptions.page;

    const workshops = await this.workshopRepository.findPublic(findOptions);
    const total = await this.workshopRepository.countPublic(findOptions);

    const enrichedWorkshops = await Promise.all(workshops.map(async (workshop) => {
      const workshopObj = workshop.toObject();

      if (currentUserId) {
        const membership = await this.membershipRepository.findByWorkshopAndUser(workshop._id.toString(), currentUserId);
        if (membership) {
          (workshopObj as any).currentUserMembership = {
            state: membership.state,
            source: membership.source,
            joinedAt: membership.joinedAt
          };
        }
      }

      const memberCount = await this.membershipRepository.countByWorkshop(workshop._id.toString(), MembershipState.ACTIVE);
      (workshopObj as any).memberCount = memberCount;

      return workshopObj;
    }));

    return {
      workshops: enrichedWorkshops,
      total,
      pages: Math.ceil(total / limit)
    };
  }

  async upvoteWorkshop(_userId: string, workshopId: string): Promise<IWorkshop> {
    const updated = await this.workshopRepository.incrementVote(workshopId, 1, true);
    return updated;
  }

  async downvoteWorkshop(_userId: string, workshopId: string): Promise<IWorkshop> {
    const updated = await this.workshopRepository.incrementVote(workshopId, -1, false);
    return updated;
  }

  async isMember(workshopId: string, userId: string): Promise<boolean> {
    return await this.membershipRepository.isActiveMember(workshopId, userId);
  }

  async checkPermission(
    userId: string,
    workshopId: string,
    action: string,
    resource: string,
    context?: any
  ) {
    return await this.permissionService.checkPermission(userId, workshopId, action, resource, context);
  }
}