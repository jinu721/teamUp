import {
  PermissionScope,
  PermissionType,
  IPermission,
  PermissionContext,
  PermissionResult,
  MembershipState,
  WorkshopVisibility
} from '../types/workshop';
import { RoleAssignmentRepository } from '../repositories/RoleAssignmentRepository';
import { WorkshopRepository } from '../repositories/WorkshopRepository';
import { TeamRepository } from '../repositories/TeamRepository';
import { MembershipRepository } from '../repositories/MembershipRepository';
import { WorkshopProjectRepository } from '../repositories/WorkshopProjectRepository';
import { Types } from 'mongoose';

/**
 * Cache entry for permission results
 */
interface CacheEntry {
  result: PermissionResult;
  timestamp: number;
}

/**
 * Helper to extract ID from a potentially populated reference
 */
function getIdString(ref: any): string {
  if (!ref) return '';
  if (typeof ref === 'string') return ref;
  if (ref instanceof Types.ObjectId) return ref.toString();
  if (typeof ref === 'object' && '_id' in ref) return ref._id.toString();
  return ref.toString();
}

/**
 * Permission Service
 * Implements layered permission evaluation with caching
 * 
 * Evaluation order (Cascading): INDIVIDUAL → TEAM → PROJECT → WORKSHOP
 * More specific scopes override less specific ones
 * Within the same scope, DENY takes precedence over GRANT
 */
export class PermissionService {
  private roleAssignmentRepository: RoleAssignmentRepository;
  private workshopRepository: WorkshopRepository;
  private teamRepository: TeamRepository;
  private membershipRepository: MembershipRepository;
  private projectRepository: WorkshopProjectRepository;

  // In-memory cache for permission results
  private cache: Map<string, CacheEntry>;
  private readonly CACHE_TTL_MS = 60000; // 1 minute cache TTL

  private static instance: PermissionService;

  public static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  private constructor() {
    this.roleAssignmentRepository = new RoleAssignmentRepository();
    this.workshopRepository = new WorkshopRepository();
    this.teamRepository = new TeamRepository();
    this.membershipRepository = new MembershipRepository();
    this.projectRepository = new WorkshopProjectRepository();
    this.cache = new Map();
  }

  /**
   * Generate cache key for permission check
   */
  private getCacheKey(
    userId: string,
    workshopId: string,
    action: string,
    resource: string,
    context?: PermissionContext
  ): string {
    return `${userId}:${workshopId}:${action}:${resource}:${context?.projectId || ''}:${context?.teamId || ''}`;
  }

  /**
   * Check if cache entry is still valid
   */
  private isCacheValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < this.CACHE_TTL_MS;
  }

  /**
   * Check permission for a user to perform an action on a resource
   */
  async checkPermission(
    userId: string,
    workshopId: string,
    action: string,
    resource: string,
    context?: PermissionContext
  ): Promise<PermissionResult> {
    // Check cache first
    const cacheKey = this.getCacheKey(userId, workshopId, action, resource, context);
    const cached = this.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      return cached.result;
    }

    // 1. Implicit High-Level Roles (Hierarchical)

    // Workshop Owner or Manager has full access
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

    // Project Manager has full access to their project
    if (context?.projectId) {
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

      // Maintainers have write/manage access to their project
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

    // 2. Base Access (Visibility & Membership)
    const workshop = await this.workshopRepository.findById(workshopId);
    if (workshop) {
      // Public workshops allow viewing by anyone
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
        // Active members get basic view access
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

    // 3. Explicit Role-Based Permissions (Cascading Scopes)
    const result = await this.evaluateLayeredPermissions(
      userId,
      workshopId,
      action,
      resource,
      context
    );

    // Cache the result
    this.cache.set(cacheKey, { result, timestamp: Date.now() });
    return result;
  }

  /**
   * Evaluate permissions across all scope levels: INDIVIDUAL → TEAM → PROJECT → WORKSHOP
   */
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
          // If checking project permission but no specific project in context, skip this layer
          // or we could check ALL projects the user belongs to, but that's inefficient.
          // Usually, specific actions on projects should provide the projectId.
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

  /**
   * Get permission at a specific scope level, prioritizing DENY
   */
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
        // DENY always wins at the same scope level
        if (p.type === PermissionType.DENY) return p;
        if (p.type === PermissionType.GRANT) bestPermission = p;
      }
    }

    return bestPermission;
  }

  // --- Cache Management ---

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

  /**
   * Check if user has any of the specified permissions
   */
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

  /**
   * Check if user has all of the specified permissions
   */
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
