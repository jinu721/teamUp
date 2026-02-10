import mongoose, { Schema } from 'mongoose';
import { ActivityAction, ActivityEntityType, IActivityHistory } from '../types/index';

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

activityHistorySchema.index({ workshop: 1, createdAt: -1 });
activityHistorySchema.index({ user: 1, createdAt: -1 });
activityHistorySchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
activityHistorySchema.index({ workshop: 1, entityType: 1, createdAt: -1 });

export const ActivityHistory = mongoose.model<IActivityHistory>('ActivityHistory', activityHistorySchema);