import { Document, Types } from 'mongoose';

export enum ActivityAction {
    CREATED = 'created',
    UPDATED = 'updated',
    DELETED = 'deleted',
    ASSIGNED = 'assigned',
    UNASSIGNED = 'unassigned',
    COMPLETED = 'completed',
    REOPENED = 'reopened',
    COMMENTED = 'commented',
    UPLOADED = 'uploaded',
    JOINED = 'joined',
    LEFT = 'left',
    INVITED = 'invited',
    APPROVED = 'approved',
    REJECTED = 'rejected'
}

export enum ActivityEntityType {
    WORKSHOP = 'workshop',
    PROJECT = 'project',
    TASK = 'task',
    TEAM = 'team',
    MESSAGE = 'message',
    MEMBER = 'member',
    ROLE = 'role',
    FILE = 'file'
}

export interface IActivityHistory extends Document {
    workshop: Types.ObjectId;
    user: Types.ObjectId;
    action: ActivityAction;
    entityType: ActivityEntityType;
    entityId: Types.ObjectId;
    entityName: string;
    description: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
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

export interface AuditLogFilters {
    action?: AuditAction;
    actor?: string;
    target?: string;
    targetType?: string;
    startDate?: Date;
    endDate?: Date;
}

export interface LogActivityData {
    workshop: string;
    user: string;
    action: ActivityAction;
    entityType: ActivityEntityType;
    entityId: string;
    entityName: string;
    description: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
}

export interface ActivityFilters {
    action?: ActivityAction;
    entityType?: ActivityEntityType;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
}
