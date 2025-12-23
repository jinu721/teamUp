import { NotificationRepository } from '../repositories/NotificationRepository';
import { INotification } from '../types';

export class NotificationService {
  private notificationRepository: NotificationRepository;

  constructor() {
    this.notificationRepository = new NotificationRepository();
  }

  async getUserNotifications(userId: string, limit: number = 50): Promise<INotification[]> {
    return await this.notificationRepository.findByUserId(userId, limit);
  }

  async getUnreadNotifications(userId: string): Promise<INotification[]> {
    return await this.notificationRepository.findUnreadByUserId(userId);
  }

  async markAsRead(notificationId: string): Promise<INotification | null> {
    return await this.notificationRepository.markAsRead(notificationId);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.markAllAsRead(userId);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationRepository.getUnreadCount(userId);
  }
}
