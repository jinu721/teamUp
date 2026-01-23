import { Types, Document } from 'mongoose';

export enum WorkshopVisibility {
  PRIVATE = 'private',
  PUBLIC = 'public'
}

export enum MembershipState {
  PENDING = 'pending',
  ACTIVE = 'active',
  REMOVED = 'removed'
}

export enum MembershipSource {
  INVITATION = 'invitation',
  JOIN_REQUEST = 'join_request',
  OPEN_ACCESS = 'open_access'
}

export enum TaskType {
  BUG = 'bug',
  FEATURE = 'feature',
  ENHANCEMENT = 'enhancement',
  DISCUSSION = 'discussion'
}

export enum ProjectCategory {
  WEB_DEVELOPMENT = 'web_development',
  MOBILE_DEVELOPMENT = 'mobile_development',
  DATA_SCIENCE = 'data_science',
  DESIGN = 'design',
  MARKETING = 'marketing',
  OTHER = 'other'
}

export enum PermissionType {
  GRANT = 'grant',
  DENY = 'deny'
}

export enum PermissionScope {
  WORKSHOP = 'workshop',
  PROJECT = 'project',
  TEAM = 'team',
  INDIVIDUAL = 'individual'
}

export enum AuditAction {

  WORKSHOP_CREATED = 'workshop_created',
  WORKSHOP_UPDATED = 'workshop_updated',
  WORKSHOP_DELETED = 'workshop_deleted',

  MANAGER_ASSIGNED = 'manager_assigned',
  MANAGER_REMOVED = 'manager_removed',

  MEMBER_INVITED = 'member_invited',
  MEMBER_JOINED = 'member_joined',
  MEMBER_LEFT = 'member_left',
  MEMBER_REMOVED = 'member_removed',
  JOIN_REQUEST_APPROVED = 'join_request_approved',
  JOIN_REQUEST_REJECTED = 'join_request_rejected',

  TEAM_CREATED = 'team_created',
  TEAM_UPDATED = 'team_updated',
  TEAM_DELETED = 'team_deleted',
  TEAM_MEMBER_ADDED = 'team_member_added',
  TEAM_MEMBER_REMOVED = 'team_member_removed',

  PROJECT_CREATED = 'project_created',
  PROJECT_UPDATED = 'project_updated',
  PROJECT_DELETED = 'project_deleted',
  PROJECT_TEAM_ASSIGNED = 'project_team_assigned',
  PROJECT_TEAM_REMOVED = 'project_team_removed',
  PROJECT_INDIVIDUAL_ASSIGNED = 'project_individual_assigned',
  PROJECT_INDIVIDUAL_REMOVED = 'project_individual_removed',
  PROJECT_MANAGER_ASSIGNED = 'project_manager_assigned',
  PROJECT_MAINTAINER_ASSIGNED = 'project_maintainer_assigned',

  ROLE_CREATED = 'role_created',
  ROLE_UPDATED = 'role_updated',
  ROLE_DELETED = 'role_deleted',
  ROLE_ASSIGNED = 'role_assigned',
  ROLE_REVOKED = 'role_revoked',

  PERMISSION_CHANGED = 'permission_changed',
  PERMISSION_DENIED = 'permission_denied',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',

  TASK_CREATED = 'task_created',
  TASK_UPDATED = 'task_updated',
  TASK_DELETED = 'task_deleted',
  TASK_ASSIGNED = 'task_assigned',
  TASK_STATUS_CHANGED = 'task_status_changed'
}

export interface IWorkshopSettings {

  allowOpenContribution: boolean;

  requireApprovalForJoin: boolean;

  publicInfoFields: string[];
}

export interface IWorkshop extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  visibility: WorkshopVisibility;
  category: ProjectCategory;
  tags: string[];
  requiredSkills: string[];
  owner: Types.ObjectId;
  managers: Types.ObjectId[];
  settings: IWorkshopSettings;
  votes: {
    userId: Types.ObjectId;
    voteType: 'upvote' | 'downvote';
    createdAt: Date;
  }[];
  upvoteCount: number;
  downvoteCount: number;
  voteScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMembership extends Document {
  _id: Types.ObjectId;
  workshop: Types.ObjectId;
  user: Types.ObjectId;
  state: MembershipState;
  source: MembershipSource;
  invitedBy?: Types.ObjectId;
  joinedAt?: Date;
  removedAt?: Date;
  removedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITeamRole {
  name: string;
  permissions: string[];
  members: Types.ObjectId[];
}

export interface ITeam extends Document {
  _id: Types.ObjectId;
  workshop: Types.ObjectId;
  name: string;
  description: string;
  members: Types.ObjectId[];
  internalRoles: ITeamRole[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IPermission {
  action: string;
  resource: string;
  type: PermissionType;
}

export interface IRole extends Document {
  _id: Types.ObjectId;
  workshop: Types.ObjectId;
  name: string;
  description: string;
  permissions: IPermission[];
  scope: PermissionScope;
  scopeId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRoleAssignment extends Document {
  _id: Types.ObjectId;
  workshop: Types.ObjectId;
  role: Types.ObjectId;
  user: Types.ObjectId;
  scope: PermissionScope;
  scopeId?: Types.ObjectId;
  assignedBy: Types.ObjectId;
  createdAt: Date;
}

export interface IWorkflowTransition {
  from: string;
  to: string;
  allowedRoles?: string[];
}

export interface ITaskWorkflow {
  statuses: string[];
  transitions: IWorkflowTransition[];
}

export interface IProjectSettings {
  allowExternalContribution: boolean;
  taskWorkflow: ITaskWorkflow;
}

export interface IWorkshopProject extends Document {
  _id: Types.ObjectId;
  workshop: Types.ObjectId;
  name: string;
  description: string;
  assignedTeams: Types.ObjectId[];
  assignedIndividuals: Types.ObjectId[];
  projectManager?: Types.ObjectId;
  maintainers: Types.ObjectId[];
  settings: IProjectSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITaskActivity {
  user: Types.ObjectId;
  action: string;
  changes: Record<string, { old: any; new: any }>;
  timestamp: Date;
}

export interface ITaskComment {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  content: string;
  mentions: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
}

export interface ITaskStatusHistory {
  _id: Types.ObjectId;
  status: string;
  changedBy: Types.ObjectId;
  changedAt: Date;
  comment?: string;
  duration?: number;
}

export interface ITaskAttachment {
  _id: Types.ObjectId;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: Types.ObjectId;
  uploadedAt: Date;
}

export interface IRecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  endDate?: Date;
  occurrences?: number;
}

export interface IWorkshopTask extends Document {
  _id: Types.ObjectId;
  workshop: Types.ObjectId;
  project?: Types.ObjectId;

  title: string;
  description: string;
  type: TaskType;
  status: string;

  parentTask?: Types.ObjectId;
  childTasks: Types.ObjectId[];
  blockedBy: Types.ObjectId[];
  blocking: Types.ObjectId[];
  dependencies: Types.ObjectId[];

  primaryOwner?: Types.ObjectId;
  assignedTeams: Types.ObjectId[];
  assignedIndividuals: Types.ObjectId[];
  contributors: Types.ObjectId[];
  watchers: Types.ObjectId[];

  priority: number;
  severity: number;
  labels: string[];
  tags: string[];

  estimatedHours?: number;
  actualHours?: number;
  startDate?: Date;
  dueDate?: Date;
  completedAt?: Date;

  statusHistory: ITaskStatusHistory[];
  activityHistory: ITaskActivity[];

  comments: ITaskComment[];
  attachments: ITaskAttachment[];
  linkedResources: {
    chatRooms?: Types.ObjectId[];
    documents?: Types.ObjectId[];
    relatedTasks?: Types.ObjectId[];
  };

  isRecurring: boolean;
  recurrencePattern?: IRecurrencePattern;
  autoAssignmentRules?: Record<string, any>;

  customFields: Record<string, any>;

  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  workshop: Types.ObjectId;
  action: AuditAction;
  actor: Types.ObjectId;
  target?: Types.ObjectId;
  targetType?: string;
  details: Record<string, any>;
  timestamp: Date;
}

export interface CreateWorkshopDTO {
  name: string;
  description: string;
  visibility: WorkshopVisibility;
  category: ProjectCategory;
  tags?: string[];
  requiredSkills?: string[];
  settings?: Partial<IWorkshopSettings>;
}

export interface UpdateWorkshopDTO {
  name?: string;
  description?: string;
  visibility?: WorkshopVisibility;
  category?: ProjectCategory;
  tags?: string[];
  requiredSkills?: string[];
  settings?: Partial<IWorkshopSettings>;
}

export interface CreateTeamDTO {
  name: string;
  description?: string;
}

export interface UpdateTeamDTO {
  name?: string;
  description?: string;
}

export interface CreateRoleDTO {
  name: string;
  description?: string;
  permissions: IPermission[];
  scope: PermissionScope;
  scopeId?: string;
}

export interface UpdateRoleDTO {
  name?: string;
  description?: string;
  permissions?: IPermission[];
}

export interface CreateWorkshopProjectDTO {
  name: string;
  description: string;
  settings?: Partial<IProjectSettings>;
}

export interface UpdateWorkshopProjectDTO {
  name?: string;
  description?: string;
  settings?: Partial<IProjectSettings>;
}

export interface CreateWorkshopTaskDTO {
  title: string;
  description?: string;
  type: TaskType;
  priority?: number;
  severity?: number;
  labels?: string[];
  tags?: string[];
  assignedTeams?: string[];
  assignedIndividuals?: string[];

  parentTask?: string;
  primaryOwner?: string;
  contributors?: string[];
  watchers?: string[];
  estimatedHours?: number;
  startDate?: Date;
  dueDate?: Date;
  isRecurring?: boolean;
  recurrencePattern?: IRecurrencePattern;
  customFields?: Record<string, any>;
}

export interface UpdateWorkshopTaskDTO {
  title?: string;
  description?: string;
  type?: TaskType;
  status?: string;
  priority?: number;
  severity?: number;
  labels?: string[];
  tags?: string[];
  assignedTeams?: string[];
  assignedIndividuals?: string[];

  primaryOwner?: string;
  contributors?: string[];
  watchers?: string[];
  estimatedHours?: number;
  actualHours?: number;
  startDate?: Date;
  dueDate?: Date;
  isRecurring?: boolean;
  recurrencePattern?: IRecurrencePattern;
  customFields?: Record<string, any>;

  blockedBy?: string[];
  blocking?: string[];
}

export interface PermissionContext {
  projectId?: string;
  teamId?: string;
}

export interface PermissionResult {
  granted: boolean;
  source?: PermissionScope;
  reason?: string;
}

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

export const DEFAULT_WORKSHOP_SETTINGS: IWorkshopSettings = {
  allowOpenContribution: false,
  requireApprovalForJoin: true,
  publicInfoFields: ['name', 'description']
};

export const DEFAULT_TASK_WORKFLOW: ITaskWorkflow = {
  statuses: ['todo', 'in_progress', 'done'],
  transitions: [
    { from: 'todo', to: 'in_progress' },
    { from: 'in_progress', to: 'done' },
    { from: 'in_progress', to: 'todo' },
    { from: 'done', to: 'in_progress' }
  ]
};

export const DEFAULT_PROJECT_SETTINGS: IProjectSettings = {
  allowExternalContribution: false,
  taskWorkflow: DEFAULT_TASK_WORKFLOW
};