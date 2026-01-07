import { NotificationRepository } from '../repositories/NotificationRepository';
import { INotification, NotificationType } from '../types';
import { SocketService } from './SocketService';
import { NotFoundError } from '../utils/errors';

/**
 * Notification Service
 * Handles all notification business logic with real-time delivery
 */
export class NotificationService {
  private notificationRepo: NotificationRepository;
  private socketService: SocketService | null = null;

  constructor() {
    this.notificationRepo = new NotificationRepository();
  }

  setSocketService(socketService: SocketService): void {
    this.socketService = socketService;
  }

  /**
   * Create and deliver a notification
   */
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

    // Deliver via WebSocket for real-time updates
    if (this.socketService) {
      this.socketService.emitToUser(data.userId, 'notification:new', notification);
    }

    return notification;
  }

  /**
   * Notify about a new comment on a post
   */
  async notifyComment(postOwnerId: string, commenterId: string, postTitle: string): Promise<void> {
    if (postOwnerId === commenterId) return; // Don't notify self

    await this.createNotification({
      userId: postOwnerId,
      type: NotificationType.COMMENT,
      title: 'New Comment',
      message: `Someone commented on your post: ${postTitle}`,
      relatedUser: commenterId
    });
  }

  /**
   * Notify about a join request
   */
  async notifyJoinRequest(postOwnerId: string, requesterId: string, postTitle: string): Promise<void> {
    await this.createNotification({
      userId: postOwnerId,
      type: NotificationType.JOIN_REQUEST,
      title: 'New Join Request',
      message: `Someone wants to join your project: ${postTitle}`,
      relatedUser: requesterId
    });
  }

  /**
   * Notify about join request response
   */
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

  /**
   * Notify about project invitation
   */
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

  /**
   * Notify about task assignment
   */
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

  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(userId: string, limit: number = 50): Promise<INotification[]> {
    return await this.notificationRepo.findByUserId(userId, limit);
  }

  /**
   * Get unread notifications
   */
  async getUnreadNotifications(userId: string): Promise<INotification[]> {
    return await this.notificationRepo.findUnreadByUserId(userId);
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<INotification> {
    const notification = await this.notificationRepo.markAsRead(notificationId);
    if (!notification) {
      throw new NotFoundError('Notification');
    }

    // Emit update for real-time sync
    if (this.socketService) {
      this.socketService.emitToUser(userId, 'notification:read', { notificationId });
    }

    return notification;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepo.markAllAsRead(userId);

    // Emit update for real-time sync
    if (this.socketService) {
      this.socketService.emitToUser(userId, 'notification:allRead', {});
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationRepo.getUnreadCount(userId);
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepo.delete(notificationId);

    if (this.socketService) {
      this.socketService.emitToUser(userId, 'notification:deleted', { notificationId });
    }
  }
}
