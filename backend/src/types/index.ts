import { Request } from 'express';
import { Types, Document } from 'mongoose';

export * from './workshop';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
    }
  }
}

export type AuthRequest = Request;

export interface SocketUser {
  userId: string;
  socketId: string;
  email: string;
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done'
}

export enum ProjectCategory {
  WEB_DEVELOPMENT = 'web_development',
  MOBILE_DEVELOPMENT = 'mobile_development',
  DATA_SCIENCE = 'data_science',
  DESIGN = 'design',
  MARKETING = 'marketing',
  OTHER = 'other'
}

export enum CommitmentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  FREELANCE = 'freelance',
  VOLUNTEER = 'volunteer',
  OPEN_SOURCE = 'open_source'
}

export enum SortOrder {
  NEW = 'new',
  TOP = 'top',
  TRENDING = 'trending'
}

export enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  TASK_UPDATED = 'task_updated',
  MESSAGE = 'message',
  PROJECT_INVITE = 'project_invite',
  PROJECT_ASSIGNED = 'project_assigned',
  JOIN_REQUEST = 'join_request',
  COMMENT = 'comment',
  WORKSHOP_INVITE = 'workshop_invite',
  TEAM_ASSIGNED = 'team_assigned',
  ROLE_ASSIGNED = 'role_assigned',
  MEMBERSHIP_APPROVED = 'membership_approved',
  MEMBERSHIP_REJECTED = 'membership_rejected'
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  profilePhoto?: string;
  skills: string[];
  interests: string[];
  isOnline: boolean;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
  isVerified?: boolean;
  verificationToken?: string;
  googleId?: string;
  githubId?: string;
}

export interface ICommunityProject extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  category: ProjectCategory;
  commitmentType: CommitmentType;
  tags: string[];
  requiredSkills: string[];
  owner: Types.ObjectId;
  votes: IVote[];
  upvoteCount: number;
  downvoteCount: number;
  voteScore: number;
  comments: IComment[];
  joinRequests: IJoinRequest[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IVote {
  userId: Types.ObjectId;
  voteType: 'upvote' | 'downvote';
  createdAt: Date;
}

export interface IComment {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface IJoinRequest {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  relatedProject?: Types.ObjectId;
  relatedWorkshop?: Types.ObjectId;
  relatedTask?: Types.ObjectId;
  relatedUser?: Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
}

export interface IPendingUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  otp: string;
  otpExpires: Date;
  createdAt: Date;
}