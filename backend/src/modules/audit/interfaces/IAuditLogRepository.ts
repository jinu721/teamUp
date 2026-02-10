import { IAuditLog, AuditAction, AuditLogFilters, Pagination } from '../../../shared/types/index';

export interface IAuditLogRepository {
    create(data: {
        workshopId: string;
        action: AuditAction;
        actorId: string;
        targetId?: string;
        targetType?: string;
        details?: Record<string, unknown>;
    }): Promise<IAuditLog>;
    findById(id: string): Promise<IAuditLog | null>;
    findByWorkshop(workshopId: string, filters?: AuditLogFilters, pagination?: Pagination): Promise<{ logs: IAuditLog[]; total: number }>;
    findByActor(workshopId: string, actorId: string, pagination?: Pagination): Promise<{ logs: IAuditLog[]; total: number }>;
    findByTarget(workshopId: string, targetId: string, targetType?: string, pagination?: Pagination): Promise<{ logs: IAuditLog[]; total: number }>;
    findByAction(workshopId: string, action: AuditAction, pagination?: Pagination): Promise<{ logs: IAuditLog[]; total: number }>;
    findRecent(workshopId: string, limit?: number): Promise<IAuditLog[]>;
    findByDateRange(workshopId: string, startDate: Date, endDate: Date, pagination?: Pagination): Promise<{ logs: IAuditLog[]; total: number }>;
    countByAction(workshopId: string): Promise<Record<string, number>>;
    getUserActivitySummary(workshopId: string, userId: string, days?: number): Promise<{ action: string; count: number }[]>;
}
