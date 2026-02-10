import { INotification, NotificationType } from '../../../shared/types/index';
import { ISocketService } from '../../../shared/interfaces/ISocketService';

export interface INotificationService {
    setSocketService(socketService: ISocketService): void;
    createNotification(data: {
        userId: string;
        type: NotificationType;
        title: string;
        message: string;
        relatedProject?: string;
        relatedTask?: string;
        relatedUser?: string;
    }): Promise<INotification>;
    notifyComment(postOwnerId: string, commenterId: string, postTitle: string): Promise<void>;
    notifyJoinRequest(postOwnerId: string, requesterId: string, postTitle: string): Promise<void>;
    notifyJoinRequestResponse(
        requesterId: string,
        postTitle: string,
        status: 'approved' | 'rejected',
        projectId?: string
    ): Promise<void>;
    notifyProjectInvite(userId: string, projectTitle: string, projectId: string, inviterId: string): Promise<void>;
    notifyTaskAssignment(userId: string, taskTitle: string, taskId: string, projectId: string): Promise<void>;
    getUserNotifications(userId: string, limit?: number): Promise<INotification[]>;
    getUnreadNotifications(userId: string): Promise<INotification[]>;
    markAsRead(notificationId: string, userId: string): Promise<INotification>;
    markAllAsRead(userId: string): Promise<void>;
    getUnreadCount(userId: string): Promise<number>;
    deleteNotification(notificationId: string, userId: string): Promise<void>;
}
