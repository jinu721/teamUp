import { IActivityHistory, ActivityEntityType, ActivityAction } from '../models/ActivityHistory';

export interface LogActivityData {
    workshop: string;
    user: string;
    action: ActivityAction;
    entityType: ActivityEntityType;
    entityId: string;
    entityName: string;
    description: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
}

export interface ActivityFilters {
    action?: ActivityAction;
    entityType?: ActivityEntityType;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
}

export interface IActivityHistoryService {
    logActivity(data: LogActivityData): Promise<IActivityHistory>;
    getWorkshopActivity(
        workshopId: string,
        filters?: ActivityFilters,
        page?: number,
        limit?: number
    ): Promise<{ activities: IActivityHistory[]; total: number; hasMore: boolean }>;
    getUserActivity(
        userId: string,
        filters?: ActivityFilters,
        page?: number,
        limit?: number
    ): Promise<{ activities: IActivityHistory[]; total: number; hasMore: boolean }>;
    getEntityActivity(
        entityType: ActivityEntityType,
        entityId: string,
        page?: number,
        limit?: number
    ): Promise<{ activities: IActivityHistory[]; total: number; hasMore: boolean }>;
    getRecentActivities(userId: string, limit?: number): Promise<IActivityHistory[]>;
    deleteOldActivities(daysOld?: number): Promise<number>;
    getWorkshopActivityStats(workshopId: string, days?: number): Promise<any>;
}
