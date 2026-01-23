import mongoose, { Schema } from 'mongoose';
import {
  IWorkshopProject,
  IProjectSettings,
  ITaskWorkflow,
  IWorkflowTransition,
  DEFAULT_PROJECT_SETTINGS,
  DEFAULT_TASK_WORKFLOW
} from '../types';

const workflowTransitionSchema = new Schema<IWorkflowTransition>(
  {
    from: {
      type: String,
      required: true
    },
    to: {
      type: String,
      required: true
    },
    allowedRoles: [{
      type: String
    }]
  },
  { _id: false }
);

const taskWorkflowSchema = new Schema<ITaskWorkflow>(
  {
    statuses: {
      type: [String],
      default: DEFAULT_TASK_WORKFLOW.statuses
    },
    transitions: {
      type: [workflowTransitionSchema],
      default: DEFAULT_TASK_WORKFLOW.transitions
    }
  },
  { _id: false }
);

const projectSettingsSchema = new Schema<IProjectSettings>(
  {
    allowExternalContribution: {
      type: Boolean,
      default: DEFAULT_PROJECT_SETTINGS.allowExternalContribution
    },
    taskWorkflow: {
      type: taskWorkflowSchema,
      default: () => ({ ...DEFAULT_TASK_WORKFLOW })
    }
  },
  { _id: false }
);

const workshopProjectSchema = new Schema<IWorkshopProject>(
  {
    workshop: {
      type: Schema.Types.ObjectId,
      ref: 'Workshop',
      required: [true, 'Workshop reference is required']
    },
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    assignedTeams: [{
      type: Schema.Types.ObjectId,
      ref: 'Team'
    }],
    assignedIndividuals: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    projectManager: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    maintainers: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    settings: {
      type: projectSettingsSchema,
      default: () => ({ ...DEFAULT_PROJECT_SETTINGS })
    }
  },
  {
    timestamps: true
  }
);

workshopProjectSchema.index({ workshop: 1 });
workshopProjectSchema.index({ assignedTeams: 1 });
workshopProjectSchema.index({ assignedIndividuals: 1 });

export const WorkshopProject = mongoose.model<IWorkshopProject>('WorkshopProject', workshopProjectSchema);