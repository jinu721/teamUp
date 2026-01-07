import mongoose, { Schema, Document } from 'mongoose';

export enum ActivityAction {
    CREATED = 'created',
    UPDATED = 'updated',
    DELETED = 'deleted',
    ASSIGNED = 'assigned',
    UNASSIGNED = 'unassigned',
    COMPLETED = 'completed',
    REOPENED = 'reopened',
    COMMENTED = 'commented',
    UPLOADED = 'uploaded',
    JOINED = 'joined',
    LEFT = 'left',
    INVITED = 'invited',
    APPROVED = 'approved',
    REJECTED = 'rejected'
}

export enum ActivityEntityType {
    WORKSHOP = 'workshop',
    PROJECT = 'project',
    TASK = 'task',
    TEAM = 'team',
    MESSAGE = 'message',
    MEMBER = 'member',
    ROLE = 'role',
    FILE = 'file'
}

export interface IActivityHistory extends Document {
    workshop: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    action: ActivityAction;
    entityType: ActivityEntityType;
    entityId: mongoose.Types.ObjectId;
    entityName: string;
    description: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
}

const activityHistorySchema = new Schema<IActivityHistory>(
    {
        workshop: {
            type: Schema.Types.ObjectId,
            ref: 'Workshop',
            required: true,
            index: true
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        action: {
            type: String,
            enum: Object.values(ActivityAction),
            required: true,
            index: true
        },
        entityType: {
            type: String,
            enum: Object.values(ActivityEntityType),
            required: true,
            index: true
        },
        entityId: {
            type: Schema.Types.ObjectId,
            required: true,
            index: true
        },
        entityName: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        metadata: {
            type: Schema.Types.Mixed
        },
        ipAddress: {
            type: String
        },
        userAgent: {
            type: String
        }
    },
    {
        timestamps: { createdAt: true, updatedAt: false }
    }
);

// Indexes for efficient queries
activityHistorySchema.index({ workshop: 1, createdAt: -1 });
activityHistorySchema.index({ user: 1, createdAt: -1 });
activityHistorySchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
activityHistorySchema.index({ workshop: 1, entityType: 1, createdAt: -1 });

export const ActivityHistory = mongoose.model<IActivityHistory>('ActivityHistory', activityHistorySchema);
