import { Response } from 'express';
import { NotificationService } from '../services/NotificationService';
import { AuthRequest } from '../types';
import { asyncHandler } from '../middlewares/errorMiddleware';

export class NotificationController {
  private notificationService: NotificationService;

  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService;
  }

  getNotifications = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 50;

    const notifications = await this.notificationService.getUserNotifications(userId, limit);

    res.status(200).json({
      success: true,
      data: notifications
    });
  });

  getUnreadNotifications = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const notifications = await this.notificationService.getUnreadNotifications(userId);

    res.status(200).json({
      success: true,
      data: notifications
    });
  });

  getUnreadCount = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const count = await this.notificationService.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      data: { count }
    });
  });

  markAsRead = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { id } = req.params;

    const notification = await this.notificationService.markAsRead(id, userId);

    res.status(200).json({
      success: true,
      data: notification
    });
  });

  markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    await this.notificationService.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  });

  deleteNotification = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { id } = req.params;

    await this.notificationService.deleteNotification(id, userId);

    res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });
  });
}