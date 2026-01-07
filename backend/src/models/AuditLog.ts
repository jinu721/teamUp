import mongoose, { Schema } from 'mongoose';
import { IAuditLog, AuditAction } from '../types';

/**
 * Audit Log Schema
 * Immutable record of critical actions for accountability and investigation
 * This collection is append-only - updates and deletes are disabled at application level
 */
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
      // Reference depends on targetType
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
    // Disable automatic timestamps since we manage timestamp manually
    timestamps: false
  }
);

// Indexes for efficient queries
auditLogSchema.index({ workshop: 1, timestamp: -1 });
auditLogSchema.index({ workshop: 1, action: 1 });
auditLogSchema.index({ actor: 1 });
auditLogSchema.index({ target: 1, targetType: 1 });

// Note: Immutability is enforced at the application/service level
// The model itself doesn't prevent updates, but the AuditService will only allow creates

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
