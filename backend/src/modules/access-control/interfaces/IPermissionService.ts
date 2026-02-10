import { PermissionContext, PermissionResult } from '../../../shared/types/index';

export interface IPermissionService {
    checkPermission(
        userId: string,
        workshopId: string,
        action: string,
        resource: string,
        context?: PermissionContext
    ): Promise<PermissionResult>;
    invalidateUserCache(userId: string, workshopId: string): void;
    invalidateWorkshopCache(workshopId: string): void;
    invalidateAllCache(): void;
    hasAnyPermission(
        userId: string,
        workshopId: string,
        permissions: { action: string; resource: string }[],
        context?: PermissionContext
    ): Promise<boolean>;
    hasAllPermissions(
        userId: string,
        workshopId: string,
        permissions: { action: string; resource: string }[],
        context?: PermissionContext
    ): Promise<boolean>;
}
