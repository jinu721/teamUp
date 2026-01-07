import { 
  IAuditLog, 
  AuditAction, 
  AuditLogFilters, 
  Pagination 
} from '../types';
import { AuditLogRepository } from '../repositories/AuditLogRepository';

/**
 * Audit Service
 * Handles audit logging for all critical workshop operations
 * 
 * All audit logs are immutable - once created, they cannot be modified or deleted.
 */
export class AuditService {
  private auditLogRepository: AuditLogRepository;

  constructor() {
    this.auditLogRepository = new AuditLogRepository();
  }

  /**
   * Log an audit entry
   */
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

  /**
   * Log workshop creation
   */
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

  /**
   * Log workshop update
   */
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

  /**
   * Log manager assignment
   */
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

  /**
   * Log manager removal
   */
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

  /**
   * Log member invitation
   */
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

  /**
   * Log member joined
   */
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

  /**
   * Log member left
   */
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

  /**
   * Log member removed
   */
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

  /**
   * Log join request approved
   */
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

  /**
   * Log join request rejected
   */
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

  /**
   * Log team creation
   */
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

  /**
   * Log team member added
   */
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

  /**
   * Log team member removed
   */
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

  /**
   * Log project creation
   */
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

  /**
   * Log role creation
   */
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

  /**
   * Log role assignment
   */
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

  /**
   * Log role revocation
   */
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

  /**
   * Log task creation
   */
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

  /**
   * Log task status change
   */
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

  /**
   * Log unauthorized access attempt
   */
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

  /**
   * Get audit logs for a workshop with filters and pagination
   */
  async getWorkshopAuditLogs(
    workshopId: string,
    filters?: AuditLogFilters,
    pagination?: Pagination
  ): Promise<{ logs: IAuditLog[]; total: number }> {
    return await this.auditLogRepository.findByWorkshop(workshopId, filters, pagination);
  }

  /**
   * Get audit logs for a specific user's activity
   */
  async getUserActivityLogs(
    workshopId: string,
    userId: string,
    pagination?: Pagination
  ): Promise<{ logs: IAuditLog[]; total: number }> {
    return await this.auditLogRepository.findByActor(workshopId, userId, pagination);
  }

  /**
   * Get audit logs for a specific target
   */
  async getTargetAuditLogs(
    workshopId: string,
    targetId: string,
    targetType?: string,
    pagination?: Pagination
  ): Promise<{ logs: IAuditLog[]; total: number }> {
    return await this.auditLogRepository.findByTarget(workshopId, targetId, targetType, pagination);
  }

  /**
   * Get recent audit logs
   */
  async getRecentLogs(workshopId: string, limit: number = 50): Promise<IAuditLog[]> {
    return await this.auditLogRepository.findRecent(workshopId, limit);
  }

  /**
   * Get activity summary for a user
   */
  async getUserActivitySummary(
    workshopId: string,
    userId: string,
    days: number = 30
  ): Promise<{ action: string; count: number }[]> {
    return await this.auditLogRepository.getUserActivitySummary(workshopId, userId, days);
  }

  /**
   * Get audit log statistics by action type
   */
  async getAuditStats(workshopId: string): Promise<Record<string, number>> {
    return await this.auditLogRepository.countByAction(workshopId);
  }
}
