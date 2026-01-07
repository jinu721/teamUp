import mongoose, { Schema } from 'mongoose';
import { ITeam, ITeamRole } from '../types';

/**
 * Team Role sub-schema
 * Internal roles within a team
 */
const teamRoleSchema = new Schema<ITeamRole>(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      trim: true
    },
    permissions: [{
      type: String,
      trim: true
    }],
    members: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  { _id: true }
);

/**
 * Team Schema
 * A group of users within a workshop that can be assigned to projects
 */
const teamSchema = new Schema<ITeam>(
  {
    workshop: {
      type: Schema.Types.ObjectId,
      ref: 'Workshop',
      required: [true, 'Workshop reference is required']
    },
    name: {
      type: String,
      required: [true, 'Team name is required'],
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
    members: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    internalRoles: [teamRoleSchema]
  },
  {
    timestamps: true
  }
);

// Unique compound index - one team name per workshop
teamSchema.index({ workshop: 1, name: 1 }, { unique: true });

// Indexes for efficient queries
teamSchema.index({ workshop: 1 });
teamSchema.index({ members: 1 });

export const Team = mongoose.model<ITeam>('Team', teamSchema);
