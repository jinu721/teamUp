import mongoose, { Schema } from 'mongoose';
import { IProject, ProjectCategory } from '../types';

const projectSchema = new Schema<IProject>(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    category: {
      type: String,
      enum: Object.values(ProjectCategory),
      required: [true, 'Project category is required']
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    teamMembers: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date
    },
    isPublic: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

projectSchema.index({ owner: 1 });
projectSchema.index({ teamMembers: 1 });
projectSchema.index({ category: 1 });

export const Project = mongoose.model<IProject>('Project', projectSchema);
