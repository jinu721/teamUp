import { Response } from 'express';
import { NotificationService } from '../services/NotificationService';
import { AuthRequest } from '../types';
import { asyncHandler } from '../middlewares/errorMiddleware';

/**
 * Notification Controller
 * Handles all HTTP requests for notifications
 */
export class NotificationController {
  private notificationService: NotificationService;

  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService;
  }

  /**
   * GET /api/notifications
   * Get user notifications
   */
  getNotifications = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 50;

    const notifications = await this.notificationService.getUserNotifications(userId, limit);

    res.status(200).json({
      success: true,
      data: notifications
    });
  });

  /**
   * GET /api/notifications/unread
   * Get unread notifications
   */
  getUnreadNotifications = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const notifications = await this.notificationService.getUnreadNotifications(userId);

    res.status(200).json({
      success: true,
      data: notifications
    });
  });

  /**
   * GET /api/notifications/count
   * Get unread notification count
   */
  getUnreadCount = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const count = await this.notificationService.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      data: { count }
    });
  });

  /**
   * PUT /api/notifications/:id/read
   * Mark a notification as read
   */
  markAsRead = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { id } = req.params;

    const notification = await this.notificationService.markAsRead(id, userId);

    res.status(200).json({
      success: true,
      data: notification
    });
  });

  /**
   * PUT /api/notifications/read-all
   * Mark all notifications as read
   */
  markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    await this.notificationService.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  });

  /**
   * DELETE /api/notifications/:id
   * Delete a notification
   */
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
