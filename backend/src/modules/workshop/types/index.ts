
import { Document, Types } from 'mongoose';

export enum ProjectCategory {
    WEB_DEVELOPMENT = 'web_development',
    MOBILE_DEVELOPMENT = 'mobile_development',
    DATA_SCIENCE = 'data_science',
    DESIGN = 'design',
    MARKETING = 'marketing',
    OTHER = 'other'
}

export enum WorkshopVisibility {
    PUBLIC = 'public',
    PRIVATE = 'private',
    INVITE_ONLY = 'invite_only',
    TEAM = 'team'
}

export interface IWorkshopSettings {
    allowOpenContribution: boolean;
    requireApprovalForJoin: boolean;
    publicInfoFields: string[];
}

export const DEFAULT_WORKSHOP_SETTINGS: IWorkshopSettings = {
    allowOpenContribution: false,
    requireApprovalForJoin: true,
    publicInfoFields: ['name', 'description', 'tags']
}

export interface IVote {
    userId: Types.ObjectId;
    voteType: 'upvote' | 'downvote';
    createdAt: Date;
}

export interface IWorkshop extends Document {
    name: string;
    description: string;
    visibility: WorkshopVisibility;
    category: ProjectCategory;
    tags: string[];
    requiredSkills: string[];
    owner: Types.ObjectId;
    managers: Types.ObjectId[];
    votes: IVote[];
    upvoteCount: number;
    downvoteCount: number;
    voteScore: number;
    settings: IWorkshopSettings;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateWorkshopDTO {
    name: string;
    description: string;
    visibility: WorkshopVisibility;
    category: ProjectCategory;
    tags?: string[];
    requiredSkills?: string[];
    settings?: IWorkshopSettings;
}

export interface UpdateWorkshopDTO {
    name?: string;
    description?: string;
    visibility?: WorkshopVisibility;
    category?: ProjectCategory;
    tags?: string[];
    requiredSkills?: string[];
    settings?: IWorkshopSettings;
}
