import {
  PermissionScope,
  PermissionType,
  IPermission,
  PermissionContext,
  PermissionResult,
  MembershipState,
  WorkshopVisibility
} from '../../../shared/types/index';
import { RoleAssignmentRepository } from '../repositories/RoleAssignmentRepository';
import { WorkshopRepository } from '../../workshop/repositories/WorkshopRepository';
import { TeamRepository } from '../../team/repositories/TeamRepository';
import { MembershipRepository } from '../../team/repositories/MembershipRepository';
import { WorkshopProjectRepository } from '../../project/repositories/WorkshopProjectRepository';
import { Types } from 'mongoose';

interface CacheEntry {
  result: PermissionResult;
  timestamp: number;
}

function getIdString(ref: any): string {
  if (!ref) return '';
  if (typeof ref === 'string') return ref;
  if (ref instanceof Types.ObjectId) return ref.toString();
  if (typeof ref === 'object' && '_id' in ref) return ref._id.toString();
  return ref.toString();
}

export class PermissionService {
  private cache: Map<string, CacheEntry>;
  private readonly CACHE_TTL_MS = 60000;

  constructor(
    private roleAssignmentRepository: RoleAssignmentRepository,
    private workshopRepository: WorkshopRepository,
    private teamRepository: TeamRepository,
    private membershipRepository: MembershipRepository,
    private projectRepository: WorkshopProjectRepository
  ) {
    this.cache = new Map();
  }

  private getCacheKey(
    userId: string,
    workshopId: string,
    action: string,
    resource: string,
    context?: PermissionContext
  ): string {
    return `${userId}:${workshopId}:${action}:${resource}:${context?.projectId || ''}:${context?.teamId || ''}`;
  }

  private isCacheValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < this.CACHE_TTL_MS;
  }

  async checkPermission(
    userId: string,
    workshopId: string,
    action: string,
    resource: string,
    context?: PermissionContext
  ): Promise<PermissionResult> {
    if (!Types.ObjectId.isValid(workshopId) || (userId && !Types.ObjectId.isValid(userId))) {
      return {
        granted: false,
        reason: 'Invalid ID format provided'
      };
    }

    const cacheKey = this.getCacheKey(userId, workshopId, action, resource, context);
    const cached = this.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      return cached.result;
    }

    const isOwnerOrManager = await this.workshopRepository.isOwnerOrManager(workshopId, userId);
    if (isOwnerOrManager) {
      const result: PermissionResult = {
        granted: true,
        source: PermissionScope.WORKSHOP,
        reason: 'Workshop Owner/Manager has full access'
      };
      this.cache.set(cacheKey, { result, timestamp: Date.now() });
      return result;
    }

    if (context?.projectId) {
      if (!Types.ObjectId.isValid(context.projectId)) {
        const result: PermissionResult = {
          granted: false,
          reason: 'Invalid project ID format'
        };
        this.cache.set(cacheKey, { result, timestamp: Date.now() });
        return result;
      }

      const project = await this.projectRepository.findById(context.projectId);
      if (project && getIdString(project.projectManager) === userId) {
        const result: PermissionResult = {
          granted: true,
          source: PermissionScope.PROJECT,
          reason: 'Project Manager has full access to project'
        };
        this.cache.set(cacheKey, { result, timestamp: Date.now() });
        return result;
      }

      if (project && project.maintainers?.some(id => getIdString(id) === userId)) {
        if (['read', 'view', 'write', 'update', 'manage'].includes(action)) {
          const result: PermissionResult = {
            granted: true,
            source: PermissionScope.PROJECT,
            reason: 'Project Maintainer has elevated access'
          };
          this.cache.set(cacheKey, { result, timestamp: Date.now() });
          return result;
        }
      }
    }

    if (context?.teamId) {
      if (!Types.ObjectId.isValid(context.teamId)) {
        const result: PermissionResult = {
          granted: false,
          reason: 'Invalid team ID format'
        };
        this.cache.set(cacheKey, { result, timestamp: Date.now() });
        return result;
      }
    }

    const workshop = await this.workshopRepository.findById(workshopId);
    if (workshop) {
      if (workshop.visibility === WorkshopVisibility.PUBLIC && (action === 'view' || action === 'read')) {
        const result: PermissionResult = {
          granted: true,
          source: PermissionScope.WORKSHOP,
          reason: 'Public workshop view access'
        };
        this.cache.set(cacheKey, { result, timestamp: Date.now() });
        return result;
      }

      const membership = await this.membershipRepository.findByWorkshopAndUser(workshopId, userId);
      if (membership) {
        if (membership.state === MembershipState.ACTIVE && (action === 'view' || action === 'read')) {
          const result: PermissionResult = {
            granted: true,
            source: PermissionScope.WORKSHOP,
            reason: 'Active member base view access'
          };
          this.cache.set(cacheKey, { result, timestamp: Date.now() });
          return result;
        }
      }
    }

    const result = await this.evaluateLayeredPermissions(
      userId,
      workshopId,
      action,
      resource,
      context
    );

    this.cache.set(cacheKey, { result, timestamp: Date.now() });
    return result;
  }

  private async evaluateLayeredPermissions(
    userId: string,
    workshopId: string,
    action: string,
    resource: string,
    context?: PermissionContext
  ): Promise<PermissionResult> {
    const orderedScopes = [
      PermissionScope.INDIVIDUAL,
      PermissionScope.TEAM,
      PermissionScope.PROJECT,
      PermissionScope.WORKSHOP
    ];

    for (const scope of orderedScopes) {
      let scopeIds: string[] = [undefined as any];

      if (scope === PermissionScope.PROJECT) {
        if (context?.projectId) {
          scopeIds = [context.projectId];
        } else {
          continue;
        }
      } else if (scope === PermissionScope.TEAM) {
        if (context?.teamId) {
          scopeIds = [context.teamId];
        } else {
          const teams = await this.teamRepository.findByMemberInWorkshop(workshopId, userId);
          scopeIds = teams.map(t => t._id.toString());
          if (scopeIds.length === 0) continue;
        }
      }

      for (const sId of scopeIds) {
        const permission = await this.getPermissionAtScope(
          userId,
          workshopId,
          action,
          resource,
          scope,
          sId
        );

        if (permission) {
          if (permission.type === PermissionType.DENY) {
            return {
              granted: false,
              source: scope,
              reason: `Explicitly denied at ${scope} level`
            };
          }
          return {
            granted: true,
            source: scope,
            reason: `Explicitly granted at ${scope} level`
          };
        }
      }
    }

    return {
      granted: false,
      source: undefined,
      reason: 'No explicit permission found'
    };
  }

  private async getPermissionAtScope(
    userId: string,
    workshopId: string,
    action: string,
    resource: string,
    scope: PermissionScope,
    scopeId?: string
  ): Promise<IPermission | null> {
    const assignments = await this.roleAssignmentRepository.findByUserAndScope(
      workshopId,
      userId,
      scope,
      scopeId
    );

    let bestPermission: IPermission | null = null;

    for (const assignment of assignments) {
      const role = assignment.role as any;
      if (!role?.permissions) continue;

      const matchingPermissions = role.permissions.filter(
        (p: IPermission) => {
          const resourceMatch = p.resource === '*' || p.resource === resource;
          if (!resourceMatch) return false;

          const actionMatch =
            p.action === '*' ||
            p.action === action ||
            p.action === 'manage' ||
            (p.action === 'write' && ['create', 'update', 'patch', 'delete', 'write'].includes(action)) ||
            (p.action === 'read' && ['view', 'read', 'list'].includes(action));

          return actionMatch;
        }
      );

      for (const p of matchingPermissions) {
        if (p.type === PermissionType.DENY) return p;
        if (p.type === PermissionType.GRANT) bestPermission = p;
      }
    }

    return bestPermission;
  }

  invalidateUserCache(userId: string, workshopId: string): void {
    const prefix = `${userId}:${workshopId}:`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) this.cache.delete(key);
    }
  }

  invalidateWorkshopCache(workshopId: string): void {
    const fragment = `:${workshopId}:`;
    for (const key of this.cache.keys()) {
      if (key.includes(fragment)) this.cache.delete(key);
    }
  }

  invalidateAllCache(): void {
    this.cache.clear();
  }

  async hasAnyPermission(
    userId: string,
    workshopId: string,
    permissions: { action: string; resource: string }[],
    context?: PermissionContext
  ): Promise<boolean> {
    for (const { action, resource } of permissions) {
      const result = await this.checkPermission(userId, workshopId, action, resource, context);
      if (result.granted) return true;
    }
    return false;
  }

  async hasAllPermissions(
    userId: string,
    workshopId: string,
    permissions: { action: string; resource: string }[],
    context?: PermissionContext
  ): Promise<boolean> {
    for (const { action, resource } of permissions) {
      const result = await this.checkPermission(userId, workshopId, action, resource, context);
      if (!result.granted) return false;
    }
    return true;
  }
}