import { Notification } from '../models/Notification';
import { INotification } from '../types';
import { Types } from 'mongoose';

export class NotificationRepository {
  async create(notificationData: Partial<INotification>): Promise<INotification> {
    const notification = new Notification(notificationData);
    return await notification.save();
  }

  async findById(id: string): Promise<INotification | null> {
    return await Notification.findById(id)
      .populate('relatedUser', 'name email profilePhoto')
      .populate('relatedProject', 'name')
      .populate('relatedTask', 'title');
  }

  async findByUserId(userId: string, limit: number = 50): Promise<INotification[]> {
    return await Notification.find({ user: new Types.ObjectId(userId) })
      .populate('relatedUser', 'name email profilePhoto')
      .populate('relatedProject', 'name')
      .populate('relatedTask', 'title')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async findUnreadByUserId(userId: string): Promise<INotification[]> {
    return await Notification.find({
      user: new Types.ObjectId(userId),
      isRead: false
    })
      .populate('relatedUser', 'name email profilePhoto')
      .populate('relatedProject', 'name')
      .populate('relatedTask', 'title')
      .sort({ createdAt: -1 });
  }

  async markAsRead(id: string): Promise<INotification | null> {
    return await Notification.findByIdAndUpdate(
      id,
      { $set: { isRead: true } },
      { new: true }
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await Notification.updateMany(
      { user: new Types.ObjectId(userId), isRead: false },
      { $set: { isRead: true } }
    );
  }

  async delete(id: string): Promise<INotification | null> {
    return await Notification.findByIdAndDelete(id);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await Notification.countDocuments({
      user: new Types.ObjectId(userId),
      isRead: false
    });
  }
}