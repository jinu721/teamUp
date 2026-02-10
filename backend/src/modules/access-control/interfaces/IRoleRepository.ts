import { IRole, CreateRoleDTO, UpdateRoleDTO, PermissionScope } from '../../../shared/types/index';

export interface IRoleRepository {
    create(workshopId: string, roleData: CreateRoleDTO): Promise<IRole>;
    findById(id: string): Promise<IRole | null>;
    findByWorkshop(workshopId: string): Promise<IRole[]>;
    findByScope(workshopId: string, scope: PermissionScope, scopeId?: string): Promise<IRole[]>;
    findByName(workshopId: string, name: string): Promise<IRole | null>;
    update(id: string, updates: UpdateRoleDTO): Promise<IRole>;
    delete(id: string): Promise<void>;
    deleteByWorkshop(workshopId: string): Promise<void>;
    deleteByScope(workshopId: string, scope: PermissionScope, scopeId?: string): Promise<void>;
    exists(workshopId: string, name: string): Promise<boolean>;
    countByWorkshop(workshopId: string): Promise<number>;
    countByScope(workshopId: string, scope: PermissionScope, scopeId?: string): Promise<number>;
    searchByName(workshopId: string, searchTerm: string): Promise<IRole[]>;
}
