import { Response, NextFunction } from 'express';
import { NotificationService } from '../services/NotificationService';
import { AuthRequest } from '../types';

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  getNotifications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 50;

      const notifications = await this.notificationService.getUserNotifications(userId, limit);

      res.status(200).json({
        success: true,
        data: notifications
      });
    } catch (error) {
      next(error);
    }
  };

  getUnreadNotifications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const notifications = await this.notificationService.getUnreadNotifications(userId);

      res.status(200).json({
        success: true,
        data: notifications
      });
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const notification = await this.notificationService.markAsRead(id);

      res.status(200).json({
        success: true,
        data: notification
      });
    } catch (error) {
      next(error);
    }
  };

  markAllAsRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      await this.notificationService.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      next(error);
    }
  };
}
