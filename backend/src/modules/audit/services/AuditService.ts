import { IAuditLog, AuditAction, AuditLogFilters } from '../types/index';
import { Pagination } from '../../../shared/types/index';
import { IAuditLogRepository } from '../interfaces/IAuditLogRepository';
import { IAuditService } from '../interfaces/IAuditService';

export class AuditService implements IAuditService {
  constructor(private auditLogRepository: IAuditLogRepository) { }

  async log(entry: {
    workshopId: string;
    action: AuditAction;
    actorId: string;
    targetId?: string;
    targetType?: string;
    details?: Record<string, unknown>;
  }): Promise<IAuditLog> {
    return await this.auditLogRepository.create(entry);
  }

  async logWorkshopCreated(
    workshopId: string,
    actorId: string,
    details?: Record<string, unknown>
  ): Promise<IAuditLog> {
    return await this.log({
      workshopId,
      action: AuditAction.WORKSHOP_CREATED,
      actorId,
      targetId: workshopId,
      targetType: 'Workshop',
      details
    });
  }

  async logWorkshopUpdated(
    workshopId: string,
    actorId: string,
    changes: Record<string, unknown>
  ): Promise<IAuditLog> {
    return await this.log({
      workshopId,
      action: AuditAction.WORKSHOP_UPDATED,
      actorId,
      targetId: workshopId,
      targetType: 'Workshop',
      details: { changes }
    });
  }

  async logManagerAssigned(
    workshopId: string,
    actorId: string,
    managerId: string
  ): Promise<IAuditLog> {
    return await this.log({
      workshopId,
      action: AuditAction.MANAGER_ASSIGNED,
      actorId,
      targetId: managerId,
      targetType: 'User',
      details: { managerId }
    });
  }

  async logManagerRemoved(
    workshopId: string,
    actorId: string,
    managerId: string
  ): Promise<IAuditLog> {
    return await this.log({
      workshopId,
      action: AuditAction.MANAGER_REMOVED,
      actorId,
      targetId: managerId,
      targetType: 'User',
      details: { managerId }
    });
  }

  async logMemberInvited(
    workshopId: string,
    actorId: string,
    invitedUserId: string
  ): Promise<IAuditLog> {
    return await this.log({
      workshopId,
      action: AuditAction.MEMBER_INVITED,
      actorId,
      targetId: invitedUserId,
      targetType: 'User',
      details: { invitedUserId }
    });
  }

  async logMemberJoined(
    workshopId: string,
    userId: string,
    source: string
  ): Promise<IAuditLog> {
    return await this.log({
      workshopId,
      action: AuditAction.MEMBER_JOINED,
      actorId: userId,
      targetId: userId,
      targetType: 'User',
      details: { source }
    });
  }

  async logMemberLeft(
    workshopId: string,
    userId: string
  ): Promise<IAuditLog> {
    return await this.log({
      workshopId,
      action: AuditAction.MEMBER_LEFT,
      actorId: userId,
      targetId: userId,
      targetType: 'User'
    });
  }

  async logMemberRemoved(
    workshopId: string,
    actorId: string,
    removedUserId: string,
    reason?: string
  ): Promise<IAuditLog> {
    return await this.log({
      workshopId,
      action: AuditAction.MEMBER_REMOVED,
      actorId,
      targetId: removedUserId,
      targetType: 'User',
      details: { reason }
    });
  }

  async logJoinRequestApproved(
    workshopId: string,
    actorId: string,
    userId: string
  ): Promise<IAuditLog> {
    return await this.log({
      workshopId,
      action: AuditAction.JOIN_REQUEST_APPROVED,
      actorId,
      targetId: userId,
      targetType: 'User'
    });
  }

  async logJoinRequestRejected(
    workshopId: string,
    actorId: string,
    userId: string,
    reason?: string
  ): Promise<IAuditLog> {
    return await this.log({
      workshopId,
      action: AuditAction.JOIN_REQUEST_REJECTED,
      actorId,
      targetId: userId,
      targetType: 'User',
      details: { reason }
    });
  }

  async logTeamCreated(
    workshopId: string,
    actorId: string,
    teamId: string,
    teamName: string
  ): Promise<IAuditLog> {
    return await this.log({
      workshopId,
      action: AuditAction.TEAM_CREATED,
      actorId,
      targetId: teamId,
      targetType: 'Team',
      details: { teamName }
    });
  }

  async logTeamMemberAdded(
    workshopId: string,
    actorId: string,
    teamId: string,
    userId: string
  ): Promise<IAuditLog> {
    return await this.log({
      workshopId,
      action: AuditAction.TEAM_MEMBER_ADDED,
      actorId,
      targetId: teamId,
      targetType: 'Team',
      details: { userId }
    });
  }

  async logTeamMemberRemoved(
    workshopId: string,
    actorId: string,
    teamId: string,
    userId: string
  ): Promise<IAuditLog> {
    return await this.log({
      workshopId,
      action: AuditAction.TEAM_MEMBER_REMOVED,
      actorId,
      targetId: teamId,
      targetType: 'Team',
      details: { userId }
    });
  }

  async logProjectCreated(
    workshopId: string,
    actorId: string,
    projectId: string,
    projectName: string
  ): Promise<IAuditLog> {
    return await this.log({
      workshopId,
      action: AuditAction.PROJECT_CREATED,
      actorId,
      targetId: projectId,
      targetType: 'Project',
      details: { projectName }
    });
  }

  async logRoleCreated(
    workshopId: string,
    actorId: string,
    roleId: string,
    roleName: string
  ): Promise<IAuditLog> {
    return await this.log({
      workshopId,
      action: AuditAction.ROLE_CREATED,
      actorId,
      targetId: roleId,
      targetType: 'Role',
      details: { roleName }
    });
  }

  async logRoleAssigned(
    workshopId: string,
    actorId: string,
    roleId: string,
    userId: string,
    roleName: string
  ): Promise<IAuditLog> {
    return await this.log({
      workshopId,
      action: AuditAction.ROLE_ASSIGNED,
      actorId,
      targetId: userId,
      targetType: 'User',
      details: { roleId, roleName }
    });
  }

  async logRoleRevoked(
    workshopId: string,
    actorId: string,
    roleId: string,
    userId: string,
    roleName: string
  ): Promise<IAuditLog> {
    return await this.log({
      workshopId,
      action: AuditAction.ROLE_REVOKED,
      actorId,
      targetId: userId,
      targetType: 'User',
      details: { roleId, roleName }
    });
  }

  async logTaskCreated(
    workshopId: string,
    actorId: string,
    taskId: string,
    taskTitle: string,
    projectId: string
  ): Promise<IAuditLog> {
    return await this.log({
      workshopId,
      action: AuditAction.TASK_CREATED,
      actorId,
      targetId: taskId,
      targetType: 'Task',
      details: { taskTitle, projectId }
    });
  }

  async logTaskStatusChanged(
    workshopId: string,
    actorId: string,
    taskId: string,
    oldStatus: string,
    newStatus: string
  ): Promise<IAuditLog> {
    return await this.log({
      workshopId,
      action: AuditAction.TASK_STATUS_CHANGED,
      actorId,
      targetId: taskId,
      targetType: 'Task',
      details: { oldStatus, newStatus }
    });
  }

  async logUnauthorizedAccess(
    workshopId: string,
    actorId: string,
    action: string,
    resource: string
  ): Promise<IAuditLog> {
    return await this.log({
      workshopId,
      action: AuditAction.UNAUTHORIZED_ACCESS,
      actorId,
      details: { attemptedAction: action, resource }
    });
  }

  async getWorkshopAuditLogs(
    workshopId: string,
    filters?: AuditLogFilters,
    pagination: Pagination = { page: 1, limit: 50 }
  ): Promise<{ logs: IAuditLog[]; total: number; totalPages: number }> {
    const result = await this.auditLogRepository.findByWorkshop(workshopId, filters, pagination);
    return {
      ...result,
      totalPages: Math.ceil(result.total / pagination.limit)
    };
  }

  async getUserActivityLogs(
    workshopId: string,
    userId: string,
    pagination: Pagination = { page: 1, limit: 50 }
  ): Promise<{ logs: IAuditLog[]; total: number; totalPages: number }> {
    const result = await this.auditLogRepository.findByActor(workshopId, userId, pagination);
    return {
      ...result,
      totalPages: Math.ceil(result.total / pagination.limit)
    };
  }

  async getTargetAuditLogs(
    workshopId: string,
    targetId: string,
    targetType?: string,
    pagination: Pagination = { page: 1, limit: 50 }
  ): Promise<{ logs: IAuditLog[]; total: number; totalPages: number }> {
    const result = await this.auditLogRepository.findByTarget(workshopId, targetId, targetType, pagination);
    return {
      ...result,
      totalPages: Math.ceil(result.total / pagination.limit)
    };
  }

  async getRecentLogs(workshopId: string, limit: number = 50): Promise<IAuditLog[]> {
    return await this.auditLogRepository.findRecent(workshopId, limit);
  }

  async getUserActivitySummary(
    workshopId: string,
    userId: string,
    days: number = 30
  ): Promise<{ action: string; count: number }[]> {
    return await this.auditLogRepository.getUserActivitySummary(workshopId, userId, days);
  }

  async getAuditStats(workshopId: string): Promise<Record<string, number>> {
    return await this.auditLogRepository.countByAction(workshopId);
  }
}