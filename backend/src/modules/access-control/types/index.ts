
import { Document, Types } from 'mongoose';

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
