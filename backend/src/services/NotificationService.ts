import { NotificationRepository } from '../repositories/NotificationRepository';
import { INotification, NotificationType } from '../types';
import { SocketService } from './SocketService';
import { NotFoundError } from '../utils/errors';

export class NotificationService {
  constructor(
    private notificationRepo: NotificationRepository,
    private socketService: SocketService | null = null
  ) { }

  setSocketService(socketService: SocketService): void {
    this.socketService = socketService;
  }

  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    relatedProject?: string;
    relatedTask?: string;
    relatedUser?: string;
  }): Promise<INotification> {
    const notification = await this.notificationRepo.create({
      user: data.userId as any,
      type: data.type,
      title: data.title,
      message: data.message,
      relatedProject: data.relatedProject as any,
      relatedTask: data.relatedTask as any,
      relatedUser: data.relatedUser as any,
      isRead: false
    } as any);

    if (this.socketService) {
      this.socketService.emitToUser(data.userId, 'notification:new', notification);
    }

    return notification;
  }

  async notifyComment(postOwnerId: string, commenterId: string, postTitle: string): Promise<void> {
    if (postOwnerId === commenterId) return;

    await this.createNotification({
      userId: postOwnerId,
      type: NotificationType.COMMENT,
      title: 'New Comment',
      message: `Someone commented on your post: ${postTitle}`,
      relatedUser: commenterId
    });
  }

  async notifyJoinRequest(postOwnerId: string, requesterId: string, postTitle: string): Promise<void> {
    await this.createNotification({
      userId: postOwnerId,
      type: NotificationType.JOIN_REQUEST,
      title: 'New Join Request',
      message: `Someone wants to join your project: ${postTitle}`,
      relatedUser: requesterId
    });
  }

  async notifyJoinRequestResponse(
    requesterId: string,
    postTitle: string,
    status: 'approved' | 'rejected',
    projectId?: string
  ): Promise<void> {
    const isApproved = status === 'approved';
    await this.createNotification({
      userId: requesterId,
      type: NotificationType.JOIN_REQUEST,
      title: isApproved ? 'Request Approved!' : 'Request Declined',
      message: isApproved
        ? `Your request to join "${postTitle}" has been approved!`
        : `Your request to join "${postTitle}" was declined.`,
      relatedProject: projectId
    });
  }

  async notifyProjectInvite(userId: string, projectTitle: string, projectId: string, inviterId: string): Promise<void> {
    await this.createNotification({
      userId,
      type: NotificationType.PROJECT_INVITE,
      title: 'Project Invitation',
      message: `You've been invited to join: ${projectTitle}`,
      relatedProject: projectId,
      relatedUser: inviterId
    });
  }

  async notifyTaskAssignment(userId: string, taskTitle: string, taskId: string, projectId: string): Promise<void> {
    await this.createNotification({
      userId,
      type: NotificationType.TASK_ASSIGNED,
      title: 'Task Assigned',
      message: `You've been assigned to: ${taskTitle}`,
      relatedTask: taskId,
      relatedProject: projectId
    });
  }

  async getUserNotifications(userId: string, limit: number = 50): Promise<INotification[]> {
    return await this.notificationRepo.findByUserId(userId, limit);
  }

  async getUnreadNotifications(userId: string): Promise<INotification[]> {
    return await this.notificationRepo.findUnreadByUserId(userId);
  }

  async markAsRead(notificationId: string, userId: string): Promise<INotification> {
    const notification = await this.notificationRepo.markAsRead(notificationId);
    if (!notification) {
      throw new NotFoundError('Notification');
    }

    if (this.socketService) {
      this.socketService.emitToUser(userId, 'notification:read', { notificationId });
    }

    return notification;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepo.markAllAsRead(userId);

    if (this.socketService) {
      this.socketService.emitToUser(userId, 'notification:allRead', {});
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationRepo.getUnreadCount(userId);
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepo.delete(notificationId);

    if (this.socketService) {
      this.socketService.emitToUser(userId, 'notification:deleted', { notificationId });
    }
  }
}