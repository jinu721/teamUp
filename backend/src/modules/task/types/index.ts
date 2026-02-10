
import { Document, Types } from 'mongoose';

export enum TaskType {
    FEATURE = 'feature',
    BUG = 'bug',
    IMPROVEMENT = 'improvement',
    TASK = 'task'
}

export interface ITaskComment {
    user: Types.ObjectId;
    content: string;
    createdAt: Date;
    updatedAt?: Date;
    mentions?: string[];
    isEdited?: boolean;
}

export interface ITaskStatusHistory {
    from: string;
    to: string;
    status?: string;
    changedBy: Types.ObjectId;
    changedAt: Date;
    comment?: string;
    duration?: number;
}

export interface ITaskAttachment {
    name?: string;
    url?: string;
    type?: string;
    size?: number;

    fileName?: string;
    fileUrl?: string;
    fileType?: string;
    fileSize?: number;

    uploadedBy: Types.ObjectId;
    uploadedAt: Date;
}

export interface ITaskActivity {
    action: string;
    actor: Types.ObjectId;
    user?: Types.ObjectId;
    timestamp: Date;
    details?: any;
    changes?: any;
}

export interface IWorkshopTask extends Document {
    title: string;
    description: string;
    project: Types.ObjectId;
    workshop: Types.ObjectId;

    parentTask?: Types.ObjectId;
    childTasks: Types.ObjectId[];

    assignees: Types.ObjectId[];
    reporter: Types.ObjectId;
    primaryOwner?: Types.ObjectId;
    contributors: Types.ObjectId[];
    watchers: Types.ObjectId[];
    assignedTeams: Types.ObjectId[];
    assignedIndividuals: Types.ObjectId[];

    status: string;
    priority: number;
    severity: number;
    type: TaskType;

    blockedBy: Types.ObjectId[];
    blocking: Types.ObjectId[];
    dependencies: Types.ObjectId[];

    labels: string[];
    tags: string[];

    estimatedHours?: number;
    actualHours?: number;
    startDate?: Date;

    comments: ITaskComment[];
    attachments: ITaskAttachment[];
    activity?: ITaskActivity[];
    activityHistory: ITaskActivity[];
    statusHistory: ITaskStatusHistory[];

    linkedResources?: {
        chatRooms: Types.ObjectId[];
        documents: Types.ObjectId[];
        relatedTasks: Types.ObjectId[];
    };

    isRecurring?: boolean;
    recurrencePattern?: {
        frequency: string;
        interval: number;
        daysOfWeek?: number[];
        dayOfMonth?: number;
        endDate?: Date;
        occurrences?: number;
    };
    autoAssignmentRules?: any;
    customFields?: any;
    createdBy: Types.ObjectId;

    dueDate?: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateWorkshopTaskDTO {
    title: string;
    description: string;
    projectId: string;

    parentTask?: string;

    assignees?: string[];
    assignedTeams?: string[];
    assignedIndividuals?: string[];

    primaryOwner?: string;
    contributors?: string[];
    watchers?: string[];

    priority?: number;
    type?: TaskType;
    dueDate?: Date;
}

export interface UpdateWorkshopTaskDTO {
    title?: string;
    description?: string;
    status?: string;
    priority?: number;

    assignees?: string[];
    assignedTeams?: string[];
    assignedIndividuals?: string[];

    primaryOwner?: string;
    contributors?: string[];
    watchers?: string[];

    blockedBy?: string[];
    blocking?: string[];

    dueDate?: Date;
}
