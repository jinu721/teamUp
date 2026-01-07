import { ActivityHistory, IActivityHistory, ActivityAction, ActivityEntityType } from '../models/ActivityHistory';
import { Types } from 'mongoose';

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

export class ActivityHistoryService {
    /**
     * Log an activity
     */
    async logActivity(data: LogActivityData): Promise<IActivityHistory> {
        const activity = await ActivityHistory.create({
            workshop: new Types.ObjectId(data.workshop),
            user: new Types.ObjectId(data.user),
            action: data.action,
            entityType: data.entityType,
            entityId: new Types.ObjectId(data.entityId),
            entityName: data.entityName,
            description: data.description,
            metadata: data.metadata,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent
        });

        return activity.populate('user');
    }

    /**
     * Get workshop activity history
     */
    async getWorkshopActivity(
        workshopId: string,
        filters?: ActivityFilters,
        page: number = 1,
        limit: number = 50
    ): Promise<{ activities: IActivityHistory[]; total: number; hasMore: boolean }> {
        const skip = (page - 1) * limit;

        const query: any = {
            workshop: new Types.ObjectId(workshopId)
        };

        if (filters?.action) {
            query.action = filters.action;
        }

        if (filters?.entityType) {
            query.entityType = filters.entityType;
        }

        if (filters?.entityId) {
            query.entityId = new Types.ObjectId(filters.entityId);
        }

        if (filters?.startDate || filters?.endDate) {
            query.createdAt = {};
            if (filters.startDate) {
                query.createdAt.$gte = filters.startDate;
            }
            if (filters.endDate) {
                query.createdAt.$lte = filters.endDate;
            }
        }

        const [activities, total] = await Promise.all([
            ActivityHistory.find(query)
                .populate('user')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            ActivityHistory.countDocuments(query)
        ]);

        return {
            activities,
            total,
            hasMore: skip + activities.length < total
        };
    }

    /**
     * Get user activity history
     */
    async getUserActivity(
        userId: string,
        filters?: ActivityFilters,
        page: number = 1,
        limit: number = 50
    ): Promise<{ activities: IActivityHistory[]; total: number; hasMore: boolean }> {
        const skip = (page - 1) * limit;

        const query: any = {
            user: new Types.ObjectId(userId)
        };

        if (filters?.action) {
            query.action = filters.action;
        }

        if (filters?.entityType) {
            query.entityType = filters.entityType;
        }

        if (filters?.startDate || filters?.endDate) {
            query.createdAt = {};
            if (filters.startDate) {
                query.createdAt.$gte = filters.startDate;
            }
            if (filters.endDate) {
                query.createdAt.$lte = filters.endDate;
            }
        }

        const [activities, total] = await Promise.all([
            ActivityHistory.find(query)
                .populate(['user', 'workshop'])
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            ActivityHistory.countDocuments(query)
        ]);

        return {
            activities,
            total,
            hasMore: skip + activities.length < total
        };
    }

    /**
     * Get entity-specific activity history
     */
    async getEntityActivity(
        entityType: ActivityEntityType,
        entityId: string,
        page: number = 1,
        limit: number = 50
    ): Promise<{ activities: IActivityHistory[]; total: number; hasMore: boolean }> {
        const skip = (page - 1) * limit;

        const query = {
            entityType,
            entityId: new Types.ObjectId(entityId)
        };

        const [activities, total] = await Promise.all([
            ActivityHistory.find(query)
                .populate('user')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            ActivityHistory.countDocuments(query)
        ]);

        return {
            activities,
            total,
            hasMore: skip + activities.length < total
        };
    }

    /**
     * Get recent activities across all workshops for a user
     */
    async getRecentActivities(
        userId: string,
        limit: number = 20
    ): Promise<IActivityHistory[]> {
        return ActivityHistory.find({
            user: new Types.ObjectId(userId)
        })
            .populate(['workshop'])
            .sort({ createdAt: -1 })
            .limit(limit);
    }

    /**
     * Delete old activities (cleanup)
     */
    async deleteOldActivities(daysOld: number = 90): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const result = await ActivityHistory.deleteMany({
            createdAt: { $lt: cutoffDate }
        });

        return result.deletedCount || 0;
    }

    /**
     * Get activity statistics for a workshop
     */
    async getWorkshopActivityStats(workshopId: string, days: number = 30): Promise<any> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const stats = await ActivityHistory.aggregate([
            {
                $match: {
                    workshop: new Types.ObjectId(workshopId),
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        action: '$action',
                        entityType: '$entityType'
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: '$_id.entityType',
                    actions: {
                        $push: {
                            action: '$_id.action',
                            count: '$count'
                        }
                    },
                    total: { $sum: '$count' }
                }
            }
        ]);

        return stats;
    }
}
