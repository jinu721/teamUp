
import { Document, Types } from 'mongoose';

export enum NotificationType {
    TASK_ASSIGNED = 'task_assigned',
    TASK_UPDATED = 'task_updated',
    MESSAGE = 'message',
    PROJECT_INVITE = 'project_invite',
    PROJECT_ASSIGNED = 'project_assigned',
    JOIN_REQUEST = 'join_request',
    COMMENT = 'comment',
    WORKSHOP_INVITE = 'workshop_invite',
    TEAM_ASSIGNED = 'team_assigned',
    ROLE_ASSIGNED = 'role_assigned',
    MEMBERSHIP_APPROVED = 'membership_approved',
    MEMBERSHIP_REJECTED = 'membership_rejected'
}

export interface INotification extends Document {
    user: Types.ObjectId;
    type: NotificationType;
    title: string;
    message: string;
    relatedProject?: Types.ObjectId;
    relatedWorkshop?: Types.ObjectId;
    relatedTask?: Types.ObjectId;
    relatedUser?: Types.ObjectId;
    isRead: boolean;
    createdAt: Date;
}
