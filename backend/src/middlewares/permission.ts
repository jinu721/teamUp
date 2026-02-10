import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AuthorizationError } from '../utils/errors';

export const requirePermission = (action: string, resource: string, scopeParam?: string) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const workshopId = req.params.workshopId || req.params.id;

      if (!workshopId) {
        throw new AuthorizationError('Workshop ID is required');
      }

      if (!req.container) {
        throw new Error('DI Container not found in request');
      }

      const permissionService = req.container.permissionSrv;

      const context: any = {};

      if (scopeParam && (scopeParam === 'projectId' || scopeParam === 'teamId')) {
        const scopeId = req.params[scopeParam];
        if (scopeId) {
          if (scopeParam === 'projectId') {
            context.projectId = scopeId;
          } else if (scopeParam === 'teamId') {
            context.teamId = scopeId;
          }
        }
      } else {
        if (req.params.projectId) {
          context.projectId = req.params.projectId;
        }
        if (req.params.teamId) {
          context.teamId = req.params.teamId;
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

export const requireWorkshopMembership = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const workshopId = req.params.workshopId || req.params.id;

    if (!workshopId) {
      throw new AuthorizationError('Workshop ID is required');
    }

    if (!req.container) {
      throw new Error('DI Container not found in request');
    }

    const permissionService = req.container.permissionSrv;

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

export const requireWorkshopOwner = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const workshopId = req.params.workshopId || req.params.id;

    if (!workshopId) {
      throw new AuthorizationError('Workshop ID is required');
    }

    if (!req.container) {
      throw new Error('DI Container not found in request');
    }

    const permissionService = req.container.permissionSrv;
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

export const requireWorkshopManager = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const workshopId = req.params.workshopId || req.params.id;

    if (!workshopId) {
      throw new AuthorizationError('Workshop ID is required');
    }

    if (!req.container) {
      throw new Error('DI Container not found in request');
    }

    const permissionService = req.container.permissionSrv;
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