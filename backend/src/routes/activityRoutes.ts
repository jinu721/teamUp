import { Router } from 'express';
import { ActivityController } from '../controllers/ActivityController';
import { authenticate } from '../middlewares/auth';
import { requireWorkshopMembership } from '../middlewares/permission';

const router = Router();
const activityController = new ActivityController();

// ============================================
// ACTIVITY HISTORY ROUTES
// ============================================

// Workshop activity
router.get('/workshops/:workshopId/activity', authenticate, requireWorkshopMembership, activityController.getWorkshopActivity);
router.get('/workshops/:workshopId/activity/stats', authenticate, requireWorkshopMembership, activityController.getWorkshopActivityStats);

// User activity
router.get('/users/:userId/activity', authenticate, activityController.getUserActivity);

// Entity activity
router.get('/activity/:entityType/:entityId', authenticate, activityController.getEntityActivity);

// Recent activities for current user
router.get('/activity/recent', authenticate, activityController.getRecentActivities);

export default router;
