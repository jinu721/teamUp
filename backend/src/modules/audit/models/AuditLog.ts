import mongoose, { Schema } from 'mongoose';
import { IAuditLog, AuditAction } from '../../../shared/types/index';

const auditLogSchema = new Schema<IAuditLog>(
  {
    workshop: {
      type: Schema.Types.ObjectId,
      ref: 'Workshop',
      required: [true, 'Workshop reference is required']
    },
    action: {
      type: String,
      enum: {
        values: Object.values(AuditAction),
        message: `Invalid action. Must be one of: ${Object.values(AuditAction).join(', ')}`
      },
      required: [true, 'Audit action is required']
    },
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Actor reference is required']
    },
    target: {
      type: Schema.Types.ObjectId

    },
    targetType: {
      type: String,
      enum: ['User', 'Workshop', 'Team', 'Project', 'Task', 'Role', 'Membership']
    },
    details: {
      type: Schema.Types.Mixed,
      default: {}
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true
    }
  },
  {

    timestamps: false
  }
);

auditLogSchema.index({ workshop: 1, timestamp: -1 });
auditLogSchema.index({ workshop: 1, action: 1 });
auditLogSchema.index({ actor: 1 });
auditLogSchema.index({ target: 1, targetType: 1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);