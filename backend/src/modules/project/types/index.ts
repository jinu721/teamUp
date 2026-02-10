
import { Document, Types } from 'mongoose';

export interface IProjectSettings {
    isPublic: boolean;
    allowComments: boolean;
    allowExternalContribution: boolean;
    taskWorkflow: ITaskWorkflow;
}

export const DEFAULT_TASK_WORKFLOW: ITaskWorkflow = {
    statuses: ['To Do', 'In Progress', 'In Review', 'Done'],
    transitions: [
        { from: 'To Do', to: 'In Progress' },
        { from: 'In Progress', to: 'In Review' },
        { from: 'In Review', to: 'Done' },
        { from: 'In Review', to: 'In Progress' }
    ]
};

export const DEFAULT_PROJECT_SETTINGS: IProjectSettings = {
    isPublic: true,
    allowComments: true,
    allowExternalContribution: false,
    taskWorkflow: DEFAULT_TASK_WORKFLOW
};

export interface ITaskWorkflow {
    statuses: string[];
    transitions: IWorkflowTransition[];
}

export interface IWorkflowTransition {
    from: string;
    to: string;
    conditions?: any;
    allowedRoles?: string[];
}

export interface IWorkshopProject extends Document {
    title: string;
    name?: string;
    description: string;
    workshop: Types.ObjectId;
    owner: Types.ObjectId;
    team?: Types.ObjectId;
    status: string;
    settings: IProjectSettings;
    workflow: ITaskWorkflow;
    tasks: Types.ObjectId[];

    projectManager?: Types.ObjectId;
    maintainers?: Types.ObjectId[];
    assignedIndividuals: Types.ObjectId[];
    assignedTeams: Types.ObjectId[];

    createdAt: Date;
    updatedAt: Date;
}

export interface CreateWorkshopProjectDTO {
    title?: string;
    name: string;
    description: string;
    teamId?: string;
    allowedRoles?: string[];
    allowExternalContribution?: boolean;
    settings?: IProjectSettings;
}

export interface UpdateWorkshopProjectDTO {
    title?: string;
    description?: string;
    status?: string;
    settings?: IProjectSettings;
}
