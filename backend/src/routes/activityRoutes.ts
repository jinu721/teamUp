import { Router } from 'express';
import { ActivityController } from '../controllers/ActivityController';
import { authenticate } from '../middlewares/auth';
import { requireWorkshopMembership } from '../middlewares/permission';

const router = Router();
const activityController = new ActivityController();

router.get('/workshops/:workshopId/activity', authenticate, requireWorkshopMembership, activityController.getWorkshopActivity);
router.get('/workshops/:workshopId/activity/stats', authenticate, requireWorkshopMembership, activityController.getWorkshopActivityStats);

router.get('/users/:userId/activity', authenticate, activityController.getUserActivity);

router.get('/activity/:entityType/:entityId', authenticate, activityController.getEntityActivity);

router.get('/activity/recent', authenticate, activityController.getRecentActivities);

export default router;