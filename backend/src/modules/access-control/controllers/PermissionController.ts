import { Response } from 'express';
import { PermissionService } from '../services/PermissionService';
import { AuthRequest } from '../../../shared/types/index';
import { ValidationError } from '../../../shared/utils/errors';
import { asyncHandler } from '../../../shared/middlewares/errorMiddleware';

export class PermissionController {
  private permissionService: PermissionService;

  constructor(permissionService: PermissionService) {
    this.permissionService = permissionService;
  }

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