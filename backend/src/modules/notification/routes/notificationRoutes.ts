import { Router } from 'express';
import { authMiddleware } from '@middlewares';
import { NOTIFICATION_ROUTES } from '@constants';
import { Container } from '@di/types';

export const createNotificationRoutes = (container: Container) => {
    const router = Router();
    const notificationController = container.notificationCtrl;

    router.use(authMiddleware);

    router.get(NOTIFICATION_ROUTES.BASE, notificationController.getNotifications);
    router.get(NOTIFICATION_ROUTES.UNREAD, notificationController.getUnreadNotifications);
    router.get(NOTIFICATION_ROUTES.COUNT, notificationController.getUnreadCount);
    router.put(NOTIFICATION_ROUTES.MARK_READ, notificationController.markAsRead);
    router.put(NOTIFICATION_ROUTES.MARK_ALL_READ, notificationController.markAllAsRead);
    router.delete(NOTIFICATION_ROUTES.DELETE, notificationController.deleteNotification);

    return router;
};

export default createNotificationRoutes;