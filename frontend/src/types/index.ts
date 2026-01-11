// ==================== ENUMS ====================

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
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
  JOIN_REQUEST = 'join_request',
  COMMENT = 'comment'
}

// ==================== USER ====================

export interface User {
  _id: string;
  name: string;
  email: string;
  profilePhoto?: string;
  skills: string[];
  interests: string[];
  isOnline: boolean;
  lastActive: Date;
}

// ==================== WORKSHOP ====================

export enum WorkshopVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  INTERNAL = 'internal'
}

// Community types replaced by Workshop

// ==================== NOTIFICATION ====================

export interface Notification {
  _id: string;
  user: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedProject?: any; // Avoiding circular dependency with WorkshopProject
  relatedWorkshop?: any; // Avoiding circular dependency with Workshop
  relatedTask?: any; // Avoiding circular dependency with WorkshopTask
  relatedUser?: User;
  isRead: boolean;
  createdAt: Date;
}

// ==================== API RESPONSES ====================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface VoteResponse {
  upvoteCount: number;
  downvoteCount: number;
  voteScore: number;
  userVote: 'upvote' | 'downvote' | null;
}


export interface CreateTaskData {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  labels?: string[];
  assignedTo?: string;
  dueDate?: Date;
}

// ==================== FILTERS ====================

export interface PostFilters {
  category?: ProjectCategory | string;
  commitmentType?: CommitmentType | string;
  skills?: string[];
  tags?: string[];
  search?: string;
  author?: string;
}

export interface CommunityPost {
  _id: string;
  title: string;
  description: string;
  category: ProjectCategory;
  commitmentType: CommitmentType;
  requiredSkills: string[];
  owner: User;
  votes: { userId: string; voteType: 'upvote' | 'downvote'; createdAt: Date }[];
  upvoteCount: number;
  downvoteCount: number;
  voteScore: number;
  comments: any[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  user: User;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface JoinRequest {
  _id: string;
  user: User;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

// ==================== HELPER TYPES ====================

export const PROJECT_CATEGORY_LABELS: Record<ProjectCategory, string> = {
  [ProjectCategory.WEB_DEVELOPMENT]: 'Web Development',
  [ProjectCategory.MOBILE_DEVELOPMENT]: 'Mobile Development',
  [ProjectCategory.DATA_SCIENCE]: 'Data Science',
  [ProjectCategory.DESIGN]: 'Design',
  [ProjectCategory.MARKETING]: 'Marketing',
  [ProjectCategory.OTHER]: 'Other'
};

export const COMMITMENT_TYPE_LABELS: Record<CommitmentType, string> = {
  [CommitmentType.FULL_TIME]: 'Full Time',
  [CommitmentType.PART_TIME]: 'Part Time',
  [CommitmentType.FREELANCE]: 'Freelance',
  [CommitmentType.VOLUNTEER]: 'Volunteer',
  [CommitmentType.OPEN_SOURCE]: 'Open Source'
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'To Do',
  [TaskStatus.IN_PROGRESS]: 'In Progress',
  [TaskStatus.DONE]: 'Done'
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'Low',
  [TaskPriority.MEDIUM]: 'Medium',
  [TaskPriority.HIGH]: 'High',
  [TaskPriority.URGENT]: 'Urgent'
};
