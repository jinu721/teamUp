import {
    IAuditLog,
    AuditAction,
    AuditLogFilters,
    Pagination
} from '../../../shared/types/index';

export interface IAuditService {
    log(entry: {
        workshopId: string;
        action: AuditAction;
        actorId: string;
        targetId?: string;
        targetType?: string;
        details?: Record<string, unknown>;
    }): Promise<IAuditLog>;
    logWorkshopCreated(workshopId: string, actorId: string, details?: Record<string, unknown>): Promise<IAuditLog>;
    logWorkshopUpdated(workshopId: string, actorId: string, changes: Record<string, unknown>): Promise<IAuditLog>;
    logManagerAssigned(workshopId: string, actorId: string, managerId: string): Promise<IAuditLog>;
    logManagerRemoved(workshopId: string, actorId: string, managerId: string): Promise<IAuditLog>;
    logMemberInvited(workshopId: string, actorId: string, invitedUserId: string): Promise<IAuditLog>;
    logMemberJoined(workshopId: string, userId: string, source: string): Promise<IAuditLog>;
    logMemberLeft(workshopId: string, userId: string): Promise<IAuditLog>;
    logMemberRemoved(workshopId: string, actorId: string, removedUserId: string, reason?: string): Promise<IAuditLog>;
    logJoinRequestApproved(workshopId: string, actorId: string, userId: string): Promise<IAuditLog>;
    logJoinRequestRejected(workshopId: string, actorId: string, userId: string, reason?: string): Promise<IAuditLog>;
    logTeamCreated(workshopId: string, actorId: string, teamId: string, teamName: string): Promise<IAuditLog>;
    logTeamMemberAdded(workshopId: string, actorId: string, teamId: string, userId: string): Promise<IAuditLog>;
    logTeamMemberRemoved(workshopId: string, actorId: string, teamId: string, userId: string): Promise<IAuditLog>;
    logProjectCreated(workshopId: string, actorId: string, projectId: string, projectName: string): Promise<IAuditLog>;
    logRoleCreated(workshopId: string, actorId: string, roleId: string, roleName: string): Promise<IAuditLog>;
    logRoleAssigned(workshopId: string, actorId: string, roleId: string, userId: string, roleName: string): Promise<IAuditLog>;
    logRoleRevoked(workshopId: string, actorId: string, roleId: string, userId: string, roleName: string): Promise<IAuditLog>;
    logTaskCreated(workshopId: string, actorId: string, taskId: string, taskTitle: string, projectId: string): Promise<IAuditLog>;
    logTaskStatusChanged(workshopId: string, actorId: string, taskId: string, oldStatus: string, newStatus: string): Promise<IAuditLog>;
    logUnauthorizedAccess(workshopId: string, actorId: string, action: string, resource: string): Promise<IAuditLog>;
    getWorkshopAuditLogs(workshopId: string, filters?: AuditLogFilters, pagination?: Pagination): Promise<{ logs: IAuditLog[]; total: number; totalPages: number }>;
    getUserActivityLogs(workshopId: string, userId: string, pagination?: Pagination): Promise<{ logs: IAuditLog[]; total: number; totalPages: number }>;
    getTargetAuditLogs(workshopId: string, targetId: string, targetType?: string, pagination?: Pagination): Promise<{ logs: IAuditLog[]; total: number; totalPages: number }>;
    getRecentLogs(workshopId: string, limit?: number): Promise<IAuditLog[]>;
    getUserActivitySummary(workshopId: string, userId: string, days?: number): Promise<{ action: string; count: number }[]>;
    getAuditStats(workshopId: string): Promise<Record<string, number>>;
}
