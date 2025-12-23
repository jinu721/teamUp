import mongoose, { Schema } from 'mongoose';
import { ICommunityProject } from '../types';

const communityProjectSchema = new Schema<ICommunityProject>(
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
      maxlength: [2000, 'Description cannot exceed 2000 characters']
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
      required: true
    },
    likes: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    comments: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      content: {
        type: String,
        required: true,
        trim: true,
        maxlength: [500, 'Comment cannot exceed 500 characters']
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    joinRequests: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  {
    timestamps: true
  }
);

communityProjectSchema.index({ owner: 1 });
communityProjectSchema.index({ tags: 1 });
communityProjectSchema.index({ requiredSkills: 1 });
communityProjectSchema.index({ createdAt: -1 });

export const CommunityProject = mongoose.model<ICommunityProject>('CommunityProject', communityProjectSchema);
