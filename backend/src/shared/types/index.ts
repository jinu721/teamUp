
import { Request } from 'express';
import { Types, Document } from 'mongoose';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
    }
  }
}

import { Container as DIContainer } from '../../di/types';

export type AuthRequest = Request & {
  container?: DIContainer;
};

export interface SocketUser {
  userId: string;
  socketId: string;
  email: string;
}

// --- WORKSHOP ---
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

// --- TEAM ---
export enum MembershipState {
    PENDING = 'pending',
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    REJECTED = 'rejected',
    LEFT = 'left',
    REMOVED = 'removed'
}

export enum MembershipSource {
    INVITE = 'invite',
    INVITATION = 'invite',
    JOIN_REQUEST = 'join_request',
    ADDED = 'added',
    OPEN_ACCESS = 'open_access'
}

export interface IMembership extends Document {
    user: Types.ObjectId;
    team: Types.ObjectId;
    workshop: Types.ObjectId;
    state: MembershipState;
    source: MembershipSource;
    role: Types.ObjectId;
    invitedBy?: Types.ObjectId;
    removedAt?: Date;
    removedBy?: Types.ObjectId;
    joinedAt: Date;
    leftAt?: Date;
}

export interface ITeamRole {
    name: string;
    permissions: string[];
    members: Types.ObjectId[];
}

export interface ITeam extends Document {
    name: string;
    description?: string;
    workshop: Types.ObjectId;
    members: IMembership[]; 
    roles?: ITeamRole[]; 
    internalRoles?: ITeamRole[];
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateTeamDTO {
    name: string;
    description?: string;
    workshopId?: string;
}

export interface UpdateTeamDTO {
    name?: string;
    description?: string;
}

// --- ACCESS CONTROL (ROLE) ---
export enum PermissionScope {
    WORKSHOP = 'workshop',
    TEAM = 'team',
    PROJECT = 'project',
    TASK = 'task',
    INDIVIDUAL = 'individual'
}

export enum PermissionType {
    READ = 'read',
    WRITE = 'write',
    DELETE = 'delete',
    ADMIN = 'admin',
    MANAGE = 'manage',
    GRANT = 'grant',
    DENY = 'deny'
}

export interface IPermission {
    resource: string;
    action: string;
    type?: string;
    scope?: PermissionScope;
}

export interface IRole extends Document {
    name: string;
    description?: string;
    workshop: Types.ObjectId;
    permissions: IPermission[];
    isDefault: boolean;
    scope: PermissionScope;
    scopeId?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export interface IRoleAssignment extends Document {
    user: Types.ObjectId;
    role: Types.ObjectId;
    workshop: Types.ObjectId;
    scope: PermissionScope;
    scopeId?: Types.ObjectId;
    assignedBy: Types.ObjectId;
    assignedAt: Date;
}

export interface CreateRoleDTO {
    name: string;
    description?: string;
    permissions: IPermission[];
    scope?: PermissionScope;
    scopeId?: string;
}

export interface UpdateRoleDTO {
    name?: string;
    description?: string;
    permissions?: IPermission[];
}

export interface PermissionContext {
    projectId?: string;
    teamId?: string;
}

export interface PermissionResult {
    granted: boolean;
    reason?: string;
    source?: PermissionScope;
}

// --- PROJECT ---
export interface IProjectSettings {
    isPublic: boolean;
    allowComments: boolean;
    allowExternalContribution?: boolean;
    taskWorkflow?: ITaskWorkflow;
}

export const DEFAULT_PROJECT_SETTINGS: IProjectSettings = {
    isPublic: true,
    allowComments: true
}

export interface ITaskWorkflow {
    states: string[];
    statuses?: string[];
    transitions: IWorkflowTransition[];
}

export interface IWorkflowTransition {
    from: string;
    to: string;
    conditions?: any;
    allowedRoles?: string[];
}

export const DEFAULT_TASK_WORKFLOW: ITaskWorkflow = {
    states: ['todo', 'in_progress', 'review', 'done'],
    transitions: []
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

// --- TASK ---
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

export enum AuditAction {
  WORKSHOP_CREATED = 'workshop_created',
  WORKSHOP_UPDATED = 'workshop_updated',
  WORKSHOP_DELETED = 'workshop_deleted',
  WORKSHOP_SETTINGS_UPDATED = 'workshop_settings_updated',

  MEMBER_INVITED = 'member_invited',
  MEMBER_JOINED = 'member_joined',
  MEMBER_LEFT = 'member_left',
  MEMBER_REMOVED = 'member_removed',
  MEMBER_ROLE_UPDATED = 'member_role_updated',
  MEMBER_UPDATED = 'member_updated',

  TASK_CREATED = 'task_created',
  TASK_UPDATED = 'task_updated',
  TASK_DELETED = 'task_deleted',
  TASK_ASSIGNED = 'task_assigned',
  TASK_STATUS_UPDATED = 'task_status_updated',
  TASK_STATUS_CHANGED = 'task_status_changed',

  PROJECT_CREATED = 'project_created',
  PROJECT_UPDATED = 'project_updated',
  PROJECT_DELETED = 'project_deleted',

  ROLE_CREATED = 'role_created',
  ROLE_UPDATED = 'role_updated',
  ROLE_DELETED = 'role_deleted',
  ROLE_ASSIGNED = 'role_assigned',
  ROLE_REVOKED = 'role_revoked',
  
  TEAM_CREATED = 'team_created',
  TEAM_UPDATED = 'team_updated',
  TEAM_DELETED = 'team_deleted',
  TEAM_MEMBER_ADDED = 'team_member_added',
  TEAM_MEMBER_REMOVED = 'team_member_removed',

  MANAGER_ASSIGNED = 'manager_assigned',
  MANAGER_REMOVED = 'manager_removed',
  JOIN_REQUEST_APPROVED = 'join_request_approved',
  JOIN_REQUEST_REJECTED = 'join_request_rejected',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  PROJECT_MANAGER_ASSIGNED = 'project_manager_assigned',
  PROJECT_MAINTAINER_ASSIGNED = 'project_maintainer_assigned'
}

export interface IAuditLog extends Document {
  workshop: Types.ObjectId;
  action: AuditAction;
  actor: Types.ObjectId;
  target?: Types.ObjectId;
  targetType?: 'User' | 'Workshop' | 'Team' | 'Project' | 'Task' | 'Role' | 'Membership';
  details?: any;
  timestamp: Date;
}

// --- COMMON & UTILS ---
export interface Pagination {
    page: number;
    limit: number;
}

export interface AuditLogFilters {
    action?: AuditAction;
    actor?: string;
    target?: string;
    targetType?: string;
    startDate?: Date;
    endDate?: Date;
}
