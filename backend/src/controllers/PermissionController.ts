import { Response } from 'express';
import { PermissionService } from '../services/PermissionService';
import { AuthRequest } from '../types';
import { ValidationError } from '../utils/errors';
import { asyncHandler } from '../middlewares/errorMiddleware';

/**
 * Permission Controller
 * Handles permission checking endpoints
 */
export class PermissionController {
  private permissionService: PermissionService;

  constructor(permissionService: PermissionService) {
    this.permissionService = permissionService;
  }

  /**
   * POST /api/workshops/:workshopId/permissions/check
   * Check if user has specific permission
   */
  checkPermission = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { workshopId } = req.params;
    const { action, resource, scopeId } = req.body;

    if (!action || !resource) {
      throw new ValidationError('Action and resource are required');
    }

    const result = await this.permissionService.checkPermission(
      userId,
      workshopId,
      action,
      resource,
      scopeId ? { teamId: scopeId } : undefined
    );

    res.status(200).json({
      success: true,
      data: result
    });
  });
}