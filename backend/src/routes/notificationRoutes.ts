import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { authenticate } from '../middlewares/auth';
import { NotificationService } from '../services/NotificationService';

const router = Router();
const notificationService = new NotificationService();
const notificationController = new NotificationController(notificationService);

router.use(authenticate);

router.get('/', notificationController.getNotifications);
router.get('/unread', notificationController.getUnreadNotifications);
router.get('/count', notificationController.getUnreadCount);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);
router.delete('/:id', notificationController.deleteNotification);

export default router;
export { notificationService };