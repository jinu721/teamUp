import { Response, NextFunction } from 'express';
import { ActivityHistoryService, ActivityFilters } from '../services/ActivityHistoryService';
import { AuthRequest } from '../types';
import { ActivityAction, ActivityEntityType } from '../models/ActivityHistory';

export class ActivityController {
    private activityService: ActivityHistoryService;

    constructor() {
        this.activityService = new ActivityHistoryService();
    }

    getWorkshopActivity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { workshopId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;

            const filters: ActivityFilters = {};

            if (req.query.action) {
                filters.action = req.query.action as ActivityAction;
            }

            if (req.query.entityType) {
                filters.entityType = req.query.entityType as ActivityEntityType;
            }

            if (req.query.entityId) {
                filters.entityId = req.query.entityId as string;
            }

            if (req.query.startDate) {
                filters.startDate = new Date(req.query.startDate as string);
            }

            if (req.query.endDate) {
                filters.endDate = new Date(req.query.endDate as string);
            }

            const result = await this.activityService.getWorkshopActivity(workshopId, filters, page, limit);

            res.json({
                success: true,
                data: result.activities,
                pagination: {
                    page,
                    limit,
                    total: result.total,
                    hasMore: result.hasMore
                },
                message: 'Workshop activity retrieved successfully'
            });
        } catch (error) {
            next(error);
        }
    };

    getUserActivity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { userId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;

            const filters: ActivityFilters = {};

            if (req.query.action) {
                filters.action = req.query.action as ActivityAction;
            }

            if (req.query.entityType) {
                filters.entityType = req.query.entityType as ActivityEntityType;
            }

            if (req.query.startDate) {
                filters.startDate = new Date(req.query.startDate as string);
            }

            if (req.query.endDate) {
                filters.endDate = new Date(req.query.endDate as string);
            }

            const result = await this.activityService.getUserActivity(userId, filters, page, limit);

            res.json({
                success: true,
                data: result.activities,
                pagination: {
                    page,
                    limit,
                    total: result.total,
                    hasMore: result.hasMore
                },
                message: 'User activity retrieved successfully'
            });
        } catch (error) {
            next(error);
        }
    };

    getEntityActivity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { entityType, entityId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;

            const result = await this.activityService.getEntityActivity(
                entityType as ActivityEntityType,
                entityId,
                page,
                limit
            );

            res.json({
                success: true,
                data: result.activities,
                pagination: {
                    page,
                    limit,
                    total: result.total,
                    hasMore: result.hasMore
                },
                message: 'Entity activity retrieved successfully'
            });
        } catch (error) {
            next(error);
        }
    };

    getRecentActivities = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.id;
            const limit = parseInt(req.query.limit as string) || 20;

            const activities = await this.activityService.getRecentActivities(userId, limit);

            res.json({
                success: true,
                data: activities,
                message: 'Recent activities retrieved successfully'
            });
        } catch (error) {
            next(error);
        }
    };

    getWorkshopActivityStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { workshopId } = req.params;
            const days = parseInt(req.query.days as string) || 30;

            const stats = await this.activityService.getWorkshopActivityStats(workshopId, days);

            res.json({
                success: true,
                data: stats,
                message: 'Workshop activity statistics retrieved successfully'
            });
        } catch (error) {
            next(error);
        }
    };
}