import mongoose, { Schema } from 'mongoose';
import { IWorkshopTask, ITaskActivity, TaskType, ITaskComment, ITaskStatusHistory, ITaskAttachment } from '../types';

/**
 * Task Activity sub-schema
 * Records changes made to a task
 */
const taskActivitySchema = new Schema<ITaskActivity>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    action: {
      type: String,
      required: true
    },
    changes: {
      type: Schema.Types.Mixed,
      default: {}
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

/**
 * Task Comment sub-schema
 */
const taskCommentSchema = new Schema<ITaskComment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    mentions: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    isEdited: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

/**
 * Task Status History sub-schema
 */
const taskStatusHistorySchema = new Schema<ITaskStatusHistory>(
  {
    status: {
      type: String,
      required: true
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    comment: {
      type: String,
      trim: true
    },
    duration: {
      type: Number
    }
  }
);

/**
 * Task Attachment sub-schema
 */
const taskAttachmentSchema = new Schema<ITaskAttachment>(
  {
    fileName: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }
);

/**
 * Workshop Task Schema
 * Enhanced task model for advanced project management
 */
const workshopTaskSchema = new Schema<IWorkshopTask>(
  {
    workshop: {
      type: Schema.Types.ObjectId,
      ref: 'Workshop',
      required: [true, 'Workshop reference is required']
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'WorkshopProject',
      required: false
    },

    // Basic Info
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
      default: ''
    },
    type: {
      type: String,
      enum: {
        values: Object.values(TaskType),
        message: `Invalid task type. Must be one of: ${Object.values(TaskType).join(', ')}`
      },
      required: [true, 'Task type is required']
    },
    status: {
      type: String,
      required: [true, 'Task status is required'],
      default: 'todo'
    },

    // Hierarchy & Relationships
    parentTask: {
      type: Schema.Types.ObjectId,
      ref: 'WorkshopTask',
      required: false
    },
    childTasks: [{
      type: Schema.Types.ObjectId,
      ref: 'WorkshopTask'
    }],
    blockedBy: [{
      type: Schema.Types.ObjectId,
      ref: 'WorkshopTask'
    }],
    blocking: [{
      type: Schema.Types.ObjectId,
      ref: 'WorkshopTask'
    }],
    dependencies: [{
      type: Schema.Types.ObjectId,
      ref: 'WorkshopTask'
    }],

    // Assignment & Ownership
    primaryOwner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    assignedTeams: [{
      type: Schema.Types.ObjectId,
      ref: 'Team'
    }],
    assignedIndividuals: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    contributors: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    watchers: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],

    // Priority & Classification
    priority: {
      type: Number,
      min: [1, 'Priority must be at least 1'],
      max: [5, 'Priority cannot exceed 5'],
      default: 3
    },
    severity: {
      type: Number,
      min: [1, 'Severity must be at least 1'],
      max: [5, 'Severity cannot exceed 5'],
      default: 3
    },
    labels: [{
      type: String,
      trim: true
    }],
    tags: [{
      type: String,
      trim: true
    }],

    // Time Tracking
    estimatedHours: {
      type: Number,
      min: 0
    },
    actualHours: {
      type: Number,
      min: 0,
      default: 0
    },
    startDate: {
      type: Date
    },
    dueDate: {
      type: Date
    },
    completedAt: {
      type: Date
    },

    // Workflow & History
    statusHistory: [taskStatusHistorySchema],
    activityHistory: [taskActivitySchema],

    // Collaboration
    comments: [taskCommentSchema],
    attachments: [taskAttachmentSchema],
    linkedResources: {
      chatRooms: [{
        type: Schema.Types.ObjectId,
        ref: 'ChatRoom'
      }],
      documents: [{
        type: Schema.Types.ObjectId,
        ref: 'Document'
      }],
      relatedTasks: [{
        type: Schema.Types.ObjectId,
        ref: 'WorkshopTask'
      }]
    },

    // Automation & Recurrence
    isRecurring: {
      type: Boolean,
      default: false
    },
    recurrencePattern: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly']
      },
      interval: { type: Number, default: 1 },
      daysOfWeek: [Number],
      dayOfMonth: Number,
      endDate: Date,
      occurrences: Number
    },
    autoAssignmentRules: {
      type: Schema.Types.Mixed,
      default: {}
    },

    // Custom Fields
    customFields: {
      type: Schema.Types.Mixed,
      default: {}
    },

    // Metadata
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'CreatedBy reference is required']
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
workshopTaskSchema.index({ workshop: 1 });
workshopTaskSchema.index({ workshop: 1, status: 1 });
workshopTaskSchema.index({ project: 1 });
workshopTaskSchema.index({ parentTask: 1 });
workshopTaskSchema.index({ primaryOwner: 1 });
workshopTaskSchema.index({ assignedTeams: 1 });
workshopTaskSchema.index({ assignedIndividuals: 1 });
workshopTaskSchema.index({ labels: 1 });
workshopTaskSchema.index({ tags: 1 });
workshopTaskSchema.index({ dueDate: 1 });
workshopTaskSchema.index({ title: 'text', description: 'text' });

export const WorkshopTask = mongoose.model<IWorkshopTask>('WorkshopTask', workshopTaskSchema);
