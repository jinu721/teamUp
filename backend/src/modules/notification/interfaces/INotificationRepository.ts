import { INotification } from '../../../shared/types/index';

export interface INotificationRepository {
    create(notificationData: Partial<INotification>): Promise<INotification>;
    findById(id: string): Promise<INotification | null>;
    findByUserId(userId: string, limit?: number): Promise<INotification[]>;
    findUnreadByUserId(userId: string): Promise<INotification[]>;
    markAsRead(id: string): Promise<INotification | null>;
    markAllAsRead(userId: string): Promise<void>;
    delete(id: string): Promise<INotification | null>;
    getUnreadCount(userId: string): Promise<number>;
}
