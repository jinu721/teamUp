import mongoose, { Schema } from 'mongoose';
import { IRoleAssignment, PermissionScope } from '../types';

/**
 * Role Assignment Schema
 * Links a role to a user within a specific scope
 */
const roleAssignmentSchema = new Schema<IRoleAssignment>(
  {
    workshop: {
      type: Schema.Types.ObjectId,
      ref: 'Workshop',
      required: [true, 'Workshop reference is required']
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: [true, 'Role reference is required']
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required']
    },
    scope: {
      type: String,
      enum: {
        values: Object.values(PermissionScope),
        message: `Invalid scope. Must be one of: ${Object.values(PermissionScope).join(', ')}`
      },
      required: [true, 'Permission scope is required']
    },
    scopeId: {
      type: Schema.Types.ObjectId
      // Reference depends on scope (Project, Team, or null for Workshop/Individual)
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'AssignedBy reference is required']
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Indexes for efficient queries
roleAssignmentSchema.index({ workshop: 1, user: 1 });
roleAssignmentSchema.index({ role: 1 });
roleAssignmentSchema.index({ user: 1, scope: 1, scopeId: 1 });

export const RoleAssignment = mongoose.model<IRoleAssignment>('RoleAssignment', roleAssignmentSchema);
