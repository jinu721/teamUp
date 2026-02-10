import { Router } from 'express';
import { authMiddleware, requireWorkshopMembership } from '@middlewares';
import { ACTIVITY_ROUTES } from '@constants';
import { Container } from '@di/types';

export const createActivityRoutes = (container: Container) => {
    const router = Router();
    const activityController = container.activityCtrl;

    router.get(ACTIVITY_ROUTES.WORKSHOP_ACTIVITY, authMiddleware, requireWorkshopMembership, activityController.getWorkshopActivity);
    router.get(ACTIVITY_ROUTES.WORKSHOP_STATS, authMiddleware, requireWorkshopMembership, activityController.getWorkshopActivityStats);
    router.get(ACTIVITY_ROUTES.USER_ACTIVITY, authMiddleware, activityController.getUserActivity);
    router.get(ACTIVITY_ROUTES.ENTITY_ACTIVITY, authMiddleware, activityController.getEntityActivity);
    router.get(ACTIVITY_ROUTES.RECENT, authMiddleware, activityController.getRecentActivities);

    return router;
};

export default createActivityRoutes;