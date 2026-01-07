import { Types, Document } from 'mongoose';

// ============================================
// ENUMS
// ============================================

/**
 * Workshop visibility modes
 * - PRIVATE: Invite-only, hidden from non-members
 * - PUBLIC: Discoverable, allows open collaboration
 */
export enum WorkshopVisibility {
  PRIVATE = 'private',
  PUBLIC = 'public'
}

/**
 * Membership states for tracking user lifecycle in a workshop
 * - PENDING: Invited or requested, awaiting approval
 * - ACTIVE: Full member with access
 * - REMOVED: Access revoked or left
 */
export enum MembershipState {
  PENDING = 'pending',
  ACTIVE = 'active',
  REMOVED = 'removed'
}

/**
 * How a user joined or was added to a workshop
 */
export enum MembershipSource {
  INVITATION = 'invitation',
  JOIN_REQUEST = 'join_request',
  OPEN_ACCESS = 'open_access'
}

/**
 * Task types for categorizing work items
 */
export enum TaskType {
  BUG = 'bug',
  FEATURE = 'feature',
  ENHANCEMENT = 'enhancement',
  DISCUSSION = 'discussion'
}

/**
 * Project categories for workshop classification
 */
export enum ProjectCategory {
  WEB_DEVELOPMENT = 'web_development',
  MOBILE_DEVELOPMENT = 'mobile_development',
  DATA_SCIENCE = 'data_science',
  DESIGN = 'design',
  MARKETING = 'marketing',
  OTHER = 'other'
}

/**
 * Permission types for role-based access control
 * - GRANT: Explicitly allow an action
 * - DENY: Explicitly forbid an action
 */
export enum PermissionType {
  GRANT = 'grant',
  DENY = 'deny'
}


/**
 * Permission scope levels for layered access control
 * Evaluation order: WORKSHOP → PROJECT → TEAM → INDIVIDUAL
 * More specific scopes override less specific ones
 */
export enum PermissionScope {
  WORKSHOP = 'workshop',
  PROJECT = 'project',
  TEAM = 'team',
  INDIVIDUAL = 'individual'
}

/**
 * Audit action types for tracking critical operations
 */
export enum AuditAction {
  // Workshop actions
  WORKSHOP_CREATED = 'workshop_created',
  WORKSHOP_UPDATED = 'workshop_updated',
  WORKSHOP_DELETED = 'workshop_deleted',

  // Manager actions
  MANAGER_ASSIGNED = 'manager_assigned',
  MANAGER_REMOVED = 'manager_removed',

  // Membership actions
  MEMBER_INVITED = 'member_invited',
  MEMBER_JOINED = 'member_joined',
  MEMBER_LEFT = 'member_left',
  MEMBER_REMOVED = 'member_removed',
  JOIN_REQUEST_APPROVED = 'join_request_approved',
  JOIN_REQUEST_REJECTED = 'join_request_rejected',

  // Team actions
  TEAM_CREATED = 'team_created',
  TEAM_UPDATED = 'team_updated',
  TEAM_DELETED = 'team_deleted',
  TEAM_MEMBER_ADDED = 'team_member_added',
  TEAM_MEMBER_REMOVED = 'team_member_removed',

  // Project actions
  PROJECT_CREATED = 'project_created',
  PROJECT_UPDATED = 'project_updated',
  PROJECT_DELETED = 'project_deleted',
  PROJECT_TEAM_ASSIGNED = 'project_team_assigned',
  PROJECT_TEAM_REMOVED = 'project_team_removed',
  PROJECT_INDIVIDUAL_ASSIGNED = 'project_individual_assigned',
  PROJECT_INDIVIDUAL_REMOVED = 'project_individual_removed',
  PROJECT_MANAGER_ASSIGNED = 'project_manager_assigned',
  PROJECT_MAINTAINER_ASSIGNED = 'project_maintainer_assigned',

  // Role actions
  ROLE_CREATED = 'role_created',
  ROLE_UPDATED = 'role_updated',
  ROLE_DELETED = 'role_deleted',
  ROLE_ASSIGNED = 'role_assigned',
  ROLE_REVOKED = 'role_revoked',

  // Permission actions
  PERMISSION_CHANGED = 'permission_changed',
  PERMISSION_DENIED = 'permission_denied',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',

  // Task actions
  TASK_CREATED = 'task_created',
  TASK_UPDATED = 'task_updated',
  TASK_DELETED = 'task_deleted',
  TASK_ASSIGNED = 'task_assigned',
  TASK_STATUS_CHANGED = 'task_status_changed'
}

// ============================================
// INTERFACES - Workshop & Settings
// ============================================

/**
 * Workshop settings for configuring behavior
 */
export interface IWorkshopSettings {
  /** Allow external contributors to join projects */
  allowOpenContribution: boolean;
  /** Require manager approval for join requests (false = open access for public workshops) */
  requireApprovalForJoin: boolean;
  /** Fields visible to non-members for public workshops */
  publicInfoFields: string[];
}


/**
 * Workshop entity - the root collaboration hub
 */
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

// ============================================
// INTERFACES - Membership
// ============================================

/**
 * Membership entity - tracks user participation in a workshop
 */
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

// ============================================
// INTERFACES - Team
// ============================================

/**
 * Internal role within a team
 */
export interface ITeamRole {
  name: string;
  permissions: string[];
  members: Types.ObjectId[];
}

/**
 * Team entity - a group of users within a workshop
 */
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

// ============================================
// INTERFACES - Role & Permission
// ============================================

/**
 * Permission definition
 */
export interface IPermission {
  action: string;
  resource: string;
  type: PermissionType;
}

/**
 * Role entity - a named collection of permissions
 */
export interface IRole extends Document {
  _id: Types.ObjectId;
  workshop: Types.ObjectId;
  name: string;
  description: string;
  permissions: IPermission[];
  scope: PermissionScope;
  scopeId?: Types.ObjectId; // Project/Team ID if scoped
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Role assignment - links a role to a user
 */
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


// ============================================
// INTERFACES - Project (Workshop-aware)
// ============================================

/**
 * Workflow transition definition
 */
export interface IWorkflowTransition {
  from: string;
  to: string;
  allowedRoles?: string[];
}

/**
 * Task workflow configuration
 */
export interface ITaskWorkflow {
  statuses: string[];
  transitions: IWorkflowTransition[];
}

/**
 * Project settings
 */
export interface IProjectSettings {
  allowExternalContribution: boolean;
  taskWorkflow: ITaskWorkflow;
}

/**
 * Workshop-aware Project entity
 */
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

// ============================================
// INTERFACES - Task (Enhanced)
// ============================================

/**
 * Task activity history entry
 */
export interface ITaskActivity {
  user: Types.ObjectId;
  action: string;
  changes: Record<string, { old: any; new: any }>;
  timestamp: Date;
}

/**
 * Task Comment - threaded discussion within a task
 */
export interface ITaskComment {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  content: string;
  mentions: Types.ObjectId[]; // Users mentioned in comment
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
}

/**
 * Task Status History - tracks workflow transitions
 */
export interface ITaskStatusHistory {
  _id: Types.ObjectId;
  status: string;
  changedBy: Types.ObjectId;
  changedAt: Date;
  comment?: string;
  duration?: number; // Time spent in previous status (milliseconds)
}

/**
 * Task Attachment - files linked to task
 */
export interface ITaskAttachment {
  _id: Types.ObjectId;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: Types.ObjectId;
  uploadedAt: Date;
}

/**
 * Recurrence Pattern - for recurring tasks
 */
export interface IRecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // Every X days/weeks/months
  daysOfWeek?: number[]; // For weekly: [0-6] where 0 is Sunday
  dayOfMonth?: number; // For monthly: 1-31
  endDate?: Date;
  occurrences?: number; // Alternative to endDate
}

/**
 * Enhanced Task entity for Workshop model
 */
export interface IWorkshopTask extends Document {
  _id: Types.ObjectId;
  workshop: Types.ObjectId;
  project?: Types.ObjectId;

  // Basic Info
  title: string;
  description: string;
  type: TaskType;
  status: string; // Dynamic based on workflow

  // Hierarchy & Relationships
  parentTask?: Types.ObjectId; // For Epic -> Task -> Subtask
  childTasks: Types.ObjectId[];
  blockedBy: Types.ObjectId[]; // Tasks that must complete before this
  blocking: Types.ObjectId[]; // Tasks waiting on this
  dependencies: Types.ObjectId[]; // General dependencies (legacy)

  // Assignment & Ownership
  primaryOwner?: Types.ObjectId; // Main responsible person
  assignedTeams: Types.ObjectId[];
  assignedIndividuals: Types.ObjectId[]; // All assigned users
  contributors: Types.ObjectId[]; // Additional helpers
  watchers: Types.ObjectId[]; // Users who get notifications

  // Priority & Classification
  priority: number; // 1-5
  severity: number; // 1-5
  labels: string[];
  tags: string[];

  // Time Tracking
  estimatedHours?: number;
  actualHours?: number;
  startDate?: Date;
  dueDate?: Date;
  completedAt?: Date;

  // Workflow & History
  statusHistory: ITaskStatusHistory[];
  activityHistory: ITaskActivity[];

  // Collaboration
  comments: ITaskComment[];
  attachments: ITaskAttachment[];
  linkedResources: {
    chatRooms?: Types.ObjectId[];
    documents?: Types.ObjectId[];
    relatedTasks?: Types.ObjectId[];
  };

  // Automation & Recurrence
  isRecurring: boolean;
  recurrencePattern?: IRecurrencePattern;
  autoAssignmentRules?: Record<string, any>;

  // Custom Fields (workshop-specific)
  customFields: Record<string, any>;

  // Metadata
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// INTERFACES - Audit Log
// ============================================

/**
 * Audit log entry - immutable record of critical actions
 */
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


// ============================================
// DTOs - Data Transfer Objects
// ============================================

// Workshop DTOs
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

// Team DTOs
export interface CreateTeamDTO {
  name: string;
  description?: string;
}

export interface UpdateTeamDTO {
  name?: string;
  description?: string;
}

// Role DTOs
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

// Project DTOs (Workshop-aware)
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

// Task DTOs (Enhanced)
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

  // Advanced Fields
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

  // Advanced Fields
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

  // Links
  blockedBy?: string[];
  blocking?: string[];
}

// ============================================
// Permission Context
// ============================================

/**
 * Context for permission evaluation
 */
export interface PermissionContext {
  projectId?: string;
  teamId?: string;
}

/**
 * Result of permission evaluation
 */
export interface PermissionResult {
  granted: boolean;
  source?: PermissionScope;
  reason?: string;
}

// ============================================
// Pagination & Filters
// ============================================

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

// ============================================
// Default Values
// ============================================

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
