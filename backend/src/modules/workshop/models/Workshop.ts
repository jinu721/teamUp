import mongoose, { Schema } from 'mongoose';
import {
  IWorkshop,
  IWorkshopSettings,
  WorkshopVisibility,
  ProjectCategory,
  DEFAULT_WORKSHOP_SETTINGS
} from '../types/index';

const workshopSettingsSchema = new Schema<IWorkshopSettings>(
  {
    allowOpenContribution: {
      type: Boolean,
      default: DEFAULT_WORKSHOP_SETTINGS.allowOpenContribution
    },
    requireApprovalForJoin: {
      type: Boolean,
      default: DEFAULT_WORKSHOP_SETTINGS.requireApprovalForJoin
    },
    publicInfoFields: {
      type: [String],
      default: DEFAULT_WORKSHOP_SETTINGS.publicInfoFields
    }
  },
  { _id: false }
);

const workshopSchema = new Schema<IWorkshop>(
  {
    name: {
      type: String,
      required: [true, 'Workshop name is required'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Workshop description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    visibility: {
      type: String,
      enum: {
        values: Object.values(WorkshopVisibility),
        message: `Invalid visibility.Must be one of: ${Object.values(WorkshopVisibility).join(', ')} `
      },
      required: [true, 'Workshop visibility is required'],
      default: WorkshopVisibility.PRIVATE
    },
    category: {
      type: String,
      enum: {
        values: Object.values(ProjectCategory),
        message: `Invalid category.Must be one of: ${Object.values(ProjectCategory).join(', ')} `
      },
      required: [true, 'Workshop category is required']
    },
    tags: {
      type: [String],
      default: []
    },
    requiredSkills: {
      type: [String],
      default: []
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Workshop owner is required']
    },
    managers: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    votes: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      voteType: {
        type: String,
        enum: ['upvote', 'downvote'],
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    upvoteCount: {
      type: Number,
      default: 0
    },
    downvoteCount: {
      type: Number,
      default: 0
    },
    voteScore: {
      type: Number,
      default: 0
    },
    settings: {
      type: workshopSettingsSchema,
      default: () => ({ ...DEFAULT_WORKSHOP_SETTINGS })
    }
  },
  {
    timestamps: true
  }
);

workshopSchema.index({ owner: 1 });
workshopSchema.index({ managers: 1 });
workshopSchema.index({ visibility: 1 });
workshopSchema.index({ name: 'text', description: 'text' });

export const Workshop = mongoose.model<IWorkshop>('Workshop', workshopSchema);