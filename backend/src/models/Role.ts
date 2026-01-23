import mongoose, { Schema } from 'mongoose';
import { IRole, IPermission, PermissionType, PermissionScope } from '../types';

const permissionSchema = new Schema<IPermission>(
  {
    action: {
      type: String,
      required: [true, 'Permission action is required'],
      trim: true
    },
    resource: {
      type: String,
      required: [true, 'Permission resource is required'],
      trim: true
    },
    type: {
      type: String,
      enum: {
        values: Object.values(PermissionType),
        message: `Invalid permission type. Must be one of: ${Object.values(PermissionType).join(', ')}`
      },
      required: [true, 'Permission type is required'],
      default: PermissionType.GRANT
    }
  },
  { _id: false }
);

const roleSchema = new Schema<IRole>(
  {
    workshop: {
      type: Schema.Types.ObjectId,
      ref: 'Workshop',
      required: [true, 'Workshop reference is required']
    },
    name: {
      type: String,
      required: [true, 'Role name is required'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: ''
    },
    permissions: [permissionSchema],
    scope: {
      type: String,
      enum: {
        values: Object.values(PermissionScope),
        message: `Invalid scope. Must be one of: ${Object.values(PermissionScope).join(', ')}`
      },
      required: [true, 'Permission scope is required'],
      default: PermissionScope.WORKSHOP
    },
    scopeId: {
      type: Schema.Types.ObjectId,

    }
  },
  {
    timestamps: true
  }
);

roleSchema.index({ workshop: 1, name: 1 }, { unique: true });

roleSchema.index({ workshop: 1 });
roleSchema.index({ scope: 1, scopeId: 1 });

export const Role = mongoose.model<IRole>('Role', roleSchema);