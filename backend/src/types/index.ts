import { Request } from 'express';
import { Types } from 'mongoose';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

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
  WEB_DEV = 'web_development',
  MOBILE_DEV = 'mobile_development',
  DATA_SCIENCE = 'data_science',
  DESIGN = 'design',
  MARKETING = 'marketing',
  OTHER = 'other'
}

export enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  TASK_UPDATED = 'task_updated',
  MESSAGE = 'message',
  PROJECT_INVITE = 'project_invite',
  JOIN_REQUEST = 'join_request',
  COMMENT = 'comment'
}

export interface IUser {
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
}

export interface IProject {
  _id: Types.ObjectId;
  title: string;
  description: string;
  category: ProjectCategory;
  owner: Types.ObjectId;
  teamMembers: Types.ObjectId[];
  startDate: Date;
  endDate?: Date;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITask {
  _id: Types.ObjectId;
  project: Types.ObjectId;
  title: string;
  description?: string;
  status: TaskStatus;
  assignedTo?: Types.ObjectId;
  createdBy: Types.ObjectId;
  dueDate?: Date;
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage {
  _id: Types.ObjectId;
  project: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
  attachments: string[];
  createdAt: Date;
}

export interface ICommunityProject {
  _id: Types.ObjectId;
  title: string;
  description: string;
  tags: string[];
  requiredSkills: string[];
  owner: Types.ObjectId;
  likes: Types.ObjectId[];
  comments: {
    user: Types.ObjectId;
    content: string;
    createdAt: Date;
  }[];
  joinRequests: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  relatedProject?: Types.ObjectId;
  relatedTask?: Types.ObjectId;
  relatedUser?: Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
}
