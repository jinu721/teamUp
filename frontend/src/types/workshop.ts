import { User, ProjectCategory } from './index';

// ==================== WORKSHOP ENUMS ====================

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

// ==================== WORKSHOP INTERFACES ====================

export interface WorkshopSettings {
  allowOpenContribution: boolean;
  requireApprovalForJoin: boolean;
  publicInfoFields: string[];
}

export interface Workshop {
  _id: string;
  name: string;
  description: string;
  visibility: WorkshopVisibility;
  owner: User;
  managers: User[];
  settings: WorkshopSettings;
  createdAt: Date;
  updatedAt: Date;
  // Discovery fields
  category?: ProjectCategory;
  tags?: string[];
  requiredSkills?: string[];
  // Voting fields
  votes?: { userId: string; voteType: 'upvote' | 'downvote'; createdAt: Date }[];
  upvoteCount?: number;
  downvoteCount?: number;
  voteScore?: number;
  memberCount?: number;
}

// ==================== MEMBERSHIP INTERFACES ====================

export interface Membership {
  _id: string;
  workshop: Workshop | string;
  user: User;
  state: MembershipState;
  source: MembershipSource;
  invitedBy?: User;
  joinedAt?: Date;
  removedAt?: Date;
  removedBy?: User;
  roles?: Role[];
  createdAt: Date;
  updatedAt: Date;
}

// ==================== TEAM INTERFACES ====================

export interface TeamRole {
  name: string;
  permissions: string[];
  members: User[];
}

export interface Team {
  _id: string;
  workshop: Workshop | string;
  name: string;
  description: string;
  members: User[];
  internalRoles: TeamRole[];
  createdAt: Date;
  updatedAt: Date;
}

// ==================== ROLE INTERFACES ====================

export interface Permission {
  action: string;
  resource: string;
  type: PermissionType;
}

export interface Role {
  _id: string;
  workshop: Workshop | string;
  name: string;
  description: string;
  permissions: Permission[];
  scope: PermissionScope;
  scopeId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleAssignment {
  _id: string;
  workshop: Workshop | string;
  role: Role;
  user: User;
  scope: PermissionScope;
  scopeId?: string;
  assignedBy: User;
  createdAt: Date;
}

// ==================== PROJECT INTERFACES ====================

export interface WorkflowTransition {
  from: string;
  to: string;
  allowedRoles?: string[];
}

export interface TaskWorkflow {
  statuses: string[];
  transitions: WorkflowTransition[];
}

export interface ProjectSettings {
  allowExternalContribution: boolean;
  taskWorkflow: TaskWorkflow;
}

export interface WorkshopProject {
  _id: string;
  workshop: Workshop | string;
  name: string;
  description: string;
  assignedTeams: Team[];
  assignedIndividuals: User[];
  projectManager?: User;
  maintainers: User[];
  settings: ProjectSettings;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== TASK INTERFACES ====================

export interface TaskActivity {
  user: User;
  action: string;
  changes: Record<string, { old: unknown; new: unknown }>;
  timestamp: string;
}

export interface TaskComment {
  _id: string;
  user: User;
  content: string;
  mentions: User[];
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
}

export interface TaskStatusHistory {
  _id: string;
  status: string;
  changedBy: User;
  changedAt: string;
  comment?: string;
  duration?: number;
}

export interface TaskAttachment {
  _id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: User;
  uploadedAt: string;
}

export interface WorkshopTask {
  _id: string;
  project: WorkshopProject | string;

  // Basic Info
  title: string;
  description: string;
  type: TaskType;
  status: string;

  // Hierarchy & Relationships
  parentTask?: WorkshopTask | string;
  childTasks: (WorkshopTask | string)[];
  blockedBy: (WorkshopTask | string)[];
  blocking: (WorkshopTask | string)[];
  dependencies: WorkshopTask[]; // Legacy support

  // Assignment & Ownership
  primaryOwner?: User;
  assignedTeams: Team[];
  assignedIndividuals: User[];
  contributors: User[];
  watchers: User[];

  // Priority & Classification
  priority: number;
  severity: number;
  labels: string[];
  tags: string[];

  // Time Tracking
  estimatedHours?: number;
  actualHours?: number;
  startDate?: string;
  dueDate?: string;
  completedAt?: string;

  // Workflow & History
  statusHistory: TaskStatusHistory[];
  activityHistory: TaskActivity[];

  // Collaboration
  comments: TaskComment[];
  attachments: TaskAttachment[];

  // Metadata
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

// ==================== AUDIT LOG INTERFACES ====================

export interface AuditLog {
  _id: string;
  workshop: Workshop | string;
  action: AuditAction;
  actor: User;
  target?: string;
  targetType?: string;
  details: Record<string, unknown>;
  timestamp: Date;
}

// ==================== PERMISSION RESULT ====================

export interface PermissionResult {
  granted: boolean;
  source?: PermissionScope;
  reason?: string;
}

// ==================== FORM DATA ====================

export interface CreateWorkshopData {
  name: string;
  description: string;
  visibility: WorkshopVisibility;
  settings?: Partial<WorkshopSettings>;
  category?: ProjectCategory;
  tags?: string[];
  requiredSkills?: string[];
}

export interface UpdateWorkshopData {
  name?: string;
  description?: string;
  visibility?: WorkshopVisibility;
  settings?: Partial<WorkshopSettings>;
  category?: ProjectCategory;
  tags?: string[];
  requiredSkills?: string[];
}

export interface CreateTeamData {
  name: string;
  description?: string;
}

export interface UpdateTeamData {
  name?: string;
  description?: string;
}

export interface CreateRoleData {
  name: string;
  description?: string;
  permissions: Permission[];
  scope: PermissionScope;
  scopeId?: string;
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissions?: Permission[];
}

export interface CreateWorkshopProjectData {
  name: string;
  description: string;
  settings?: Partial<ProjectSettings>;
}

export interface UpdateWorkshopProjectData {
  name?: string;
  description?: string;
  settings?: Partial<ProjectSettings>;
}

export interface CreateWorkshopTaskData {
  title: string;
  description?: string;
  type: TaskType;
  priority?: number;
  severity?: number;
  labels?: string[];
  tags?: string[];
  parentTask?: string;
  primaryOwner?: string;
  contributors?: string[];
  watchers?: string[];
  estimatedHours?: number;
  startDate?: string;
  dueDate?: string;
}

export interface UpdateWorkshopTaskData {
  title?: string;
  description?: string;
  type?: TaskType;
  status?: string;
  priority?: number;
  severity?: number;
  labels?: string[];
  tags?: string[];
  parentTask?: string;
  primaryOwner?: string;
  contributors?: string[];
  watchers?: string[];
  blockedBy?: string[];
  blocking?: string[];
  estimatedHours?: number;
  actualHours?: number;
  startDate?: string;
  dueDate?: string;
  completedAt?: string;
}

// ==================== FILTER INTERFACES ====================

export interface AuditLogFilters {
  action?: AuditAction;
  actor?: string;
  target?: string;
  targetType?: string;
  startDate?: Date;
  endDate?: Date;
}

// ==================== LABEL HELPERS ====================

export const WORKSHOP_VISIBILITY_LABELS: Record<WorkshopVisibility, string> = {
  [WorkshopVisibility.PRIVATE]: 'Private',
  [WorkshopVisibility.PUBLIC]: 'Public'
};

export const MEMBERSHIP_STATE_LABELS: Record<MembershipState, string> = {
  [MembershipState.PENDING]: 'Pending',
  [MembershipState.ACTIVE]: 'Active',
  [MembershipState.REMOVED]: 'Removed'
};

export const MEMBERSHIP_SOURCE_LABELS: Record<MembershipSource, string> = {
  [MembershipSource.INVITATION]: 'Invitation',
  [MembershipSource.JOIN_REQUEST]: 'Join Request',
  [MembershipSource.OPEN_ACCESS]: 'Open Access'
};

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  [TaskType.BUG]: 'Bug',
  [TaskType.FEATURE]: 'Feature',
  [TaskType.ENHANCEMENT]: 'Enhancement',
  [TaskType.DISCUSSION]: 'Discussion'
};

export const PERMISSION_SCOPE_LABELS: Record<PermissionScope, string> = {
  [PermissionScope.WORKSHOP]: 'Workshop',
  [PermissionScope.PROJECT]: 'Project',
  [PermissionScope.TEAM]: 'Team',
  [PermissionScope.INDIVIDUAL]: 'Individual'
};

// ==================== DEFAULT VALUES ====================

export const DEFAULT_WORKSHOP_SETTINGS: WorkshopSettings = {
  allowOpenContribution: false,
  requireApprovalForJoin: true,
  publicInfoFields: ['name', 'description']
};

export const DEFAULT_TASK_WORKFLOW: TaskWorkflow = {
  statuses: ['todo', 'in_progress', 'done'],
  transitions: [
    { from: 'todo', to: 'in_progress' },
    { from: 'in_progress', to: 'done' },
    { from: 'in_progress', to: 'todo' },
    { from: 'done', to: 'in_progress' }
  ]
};

export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  allowExternalContribution: false,
  taskWorkflow: DEFAULT_TASK_WORKFLOW
};
