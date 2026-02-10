import mongoose, { Schema } from 'mongoose';
import { INotification, NotificationType } from '../types/index';

const notificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    relatedProject: {
      type: Schema.Types.ObjectId,
      ref: 'WorkshopProject'
    },
    relatedWorkshop: {
      type: Schema.Types.ObjectId,
      ref: 'Workshop'
    },
    relatedTask: {
      type: Schema.Types.ObjectId,
      ref: 'WorkshopTask'
    },
    relatedUser: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);