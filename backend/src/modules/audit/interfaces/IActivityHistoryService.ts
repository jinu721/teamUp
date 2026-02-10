import { IActivityHistory, ActivityEntityType, ActivityAction } from '../models/ActivityHistory';
import { LogActivityData, ActivityFilters } from '../types/index';


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
