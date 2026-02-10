import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { Container } from '../di/types';

export const createNotificationRoutes = (container: Container) => {
    const router = Router();
    const notificationController = container.notificationCtrl;

    router.use(authenticate);

    router.get('/', notificationController.getNotifications);
    router.get('/unread', notificationController.getUnreadNotifications);
    router.get('/count', notificationController.getUnreadCount);
    router.put('/:id/read', notificationController.markAsRead);
    router.put('/read-all', notificationController.markAllAsRead);
    router.delete('/:id', notificationController.deleteNotification);

    return router;
};

export default createNotificationRoutes;