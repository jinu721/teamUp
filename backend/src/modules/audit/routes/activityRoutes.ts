import { Router } from 'express';
import { authenticate } from '../../../shared/middlewares/auth';
import { requireWorkshopMembership } from '../../../shared/middlewares/permission';
import { Container } from '../../../di/types';

export const createActivityRoutes = (container: Container) => {
    const router = Router();
    const activityController = container.activityCtrl;

    router.get('/workshops/:workshopId/activity', authenticate, requireWorkshopMembership, activityController.getWorkshopActivity);
    router.get('/workshops/:workshopId/activity/stats', authenticate, requireWorkshopMembership, activityController.getWorkshopActivityStats);
    router.get('/users/:userId/activity', authenticate, activityController.getUserActivity);
    router.get('/activity/:entityType/:entityId', authenticate, activityController.getEntityActivity);
    router.get('/activity/recent', authenticate, activityController.getRecentActivities);

    return router;
};

export default createActivityRoutes;