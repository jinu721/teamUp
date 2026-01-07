import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { PermissionService } from '../services/PermissionService';
import { AuthorizationError } from '../utils/errors';

/**
 * Permission middleware factory
 * Creates middleware that checks if user has required permission
 */
export const requirePermission = (action: string, resource: string, scopeParam?: string) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const workshopId = req.params.workshopId || req.params.id;

      if (!workshopId) {
        throw new AuthorizationError('Workshop ID is required');
      }

      const permissionService = PermissionService.getInstance();

      // Determine scope ID from request parameters
      // Automatically detect if it's a project or team scope based on parameter name or resource
      let scopeId: string | undefined;
      if (scopeParam) {
        scopeId = req.params[scopeParam];
      } else if (req.params.projectId) {
        scopeId = req.params.projectId;
      } else if (req.params.teamId) {
        scopeId = req.params.teamId;
      }

      const context: any = {};
      if (scopeId) {
        // If resource is project or scopeParam suggests project, set projectId
        if (resource === 'project' || resource === 'task' || scopeParam === 'projectId' || req.params.projectId) {
          context.projectId = scopeId;
        }
        // If resource is team or scopeParam suggests team, set teamId
        if (resource === 'team' || scopeParam === 'teamId' || req.params.teamId) {
          context.teamId = scopeId;
        }
      }

      const hasPermission = await permissionService.checkPermission(
        userId,
        workshopId,
        action,
        resource,
        Object.keys(context).length > 0 ? context : undefined
      );

      if (!hasPermission.granted) {
        throw new AuthorizationError(`Insufficient permissions to ${action} ${resource}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Workshop membership middleware
 * Checks if user is a member of the workshop
 */
export const requireWorkshopMembership = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const workshopId = req.params.workshopId || req.params.id;

    if (!workshopId) {
      throw new AuthorizationError('Workshop ID is required');
    }

    const permissionService = PermissionService.getInstance();

    // Check if user has any permission in the workshop (which means they're a member)
    const hasPermission = await permissionService.checkPermission(
      userId,
      workshopId,
      'view',
      'workshop'
    );

    if (!hasPermission.granted) {
      throw new AuthorizationError('You must be a workshop member to access this resource');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Workshop owner middleware
 * Checks if user is the owner of the workshop
 */
export const requireWorkshopOwner = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const workshopId = req.params.workshopId || req.params.id;

    if (!workshopId) {
      throw new AuthorizationError('Workshop ID is required');
    }

    const permissionService = PermissionService.getInstance();
    const hasPermission = await permissionService.checkPermission(
      userId,
      workshopId,
      'manage',
      'workshop'
    );

    if (!hasPermission.granted || hasPermission.source !== 'workshop') {
      throw new AuthorizationError('Only workshop owners can perform this action');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Workshop manager middleware
 * Checks if user is an owner or manager of the workshop
 */
export const requireWorkshopManager = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const workshopId = req.params.workshopId || req.params.id;

    if (!workshopId) {
      throw new AuthorizationError('Workshop ID is required');
    }

    const permissionService = PermissionService.getInstance();
    const hasPermission = await permissionService.checkPermission(
      userId,
      workshopId,
      'manage',
      'workshop'
    );

    if (!hasPermission.granted) {
      throw new AuthorizationError('Only workshop owners and managers can perform this action');
    }

    next();
  } catch (error) {
    next(error);
  }
};