import { IRoleAssignment, PermissionScope } from '../types/index';
import { CreateRoleAssignmentDTO } from '../repositories/RoleAssignmentRepository';

export interface IRoleAssignmentRepository {
    create(assignmentData: CreateRoleAssignmentDTO): Promise<IRoleAssignment>;
    findById(id: string): Promise<IRoleAssignment | null>;
    findByUser(workshopId: string, userId: string): Promise<IRoleAssignment[]>;
    findByUserAndScope(workshopId: string, userId: string, scope: PermissionScope, scopeId?: string): Promise<IRoleAssignment[]>;
    findByRole(roleId: string): Promise<IRoleAssignment[]>;
    findByWorkshop(workshopId: string): Promise<IRoleAssignment[]>;
    findByScope(workshopId: string, scope: PermissionScope, scopeId?: string): Promise<IRoleAssignment[]>;
    delete(id: string): Promise<void>;
    deleteByUser(workshopId: string, userId: string): Promise<void>;
    deleteByUserAndRole(workshopId: string, userId: string, roleId: string): Promise<void>;
    deleteByRole(roleId: string): Promise<void>;
    deleteByWorkshop(workshopId: string): Promise<void>;
    deleteByScope(workshopId: string, scope: PermissionScope, scopeId?: string): Promise<void>;
    exists(workshopId: string, roleId: string, userId: string, scope: PermissionScope, scopeId?: string): Promise<boolean>;
    countByUser(workshopId: string, userId: string): Promise<number>;
    countByRole(roleId: string): Promise<number>;
    countByWorkshop(workshopId: string): Promise<number>;
}
