import { Response } from 'express';
import { IAuditService } from '../interfaces/IAuditService';
import { IWorkshopRepository } from '../../workshop/interfaces/IWorkshopRepository';
import { AuthRequest, AuditAction } from '../../../shared/types/index';
import { AuthorizationError } from '../../../shared/utils/errors';
import { asyncHandler } from '../../../shared/middlewares/errorMiddleware';

export class AuditController {
  constructor(
    private auditService: IAuditService,
    private workshopRepository: IWorkshopRepository
  ) { }

  private async checkAccess(workshopId: string, userId: string): Promise<void> {
    const canView = await this.workshopRepository.isOwnerOrManager(workshopId, userId);
    if (!canView) {
      throw new AuthorizationError('Only workshop owner or managers can view audit logs');
    }
  }

  getAuditLogs = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { workshopId } = req.params;
    const { action, actor, target, targetType, startDate, endDate, page, limit } = req.query;

    await this.checkAccess(workshopId, userId);

    const filters = {
      action: action as AuditAction | undefined,
      actor: actor as string | undefined,
      target: target as string | undefined,
      targetType: targetType as string | undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    };

    const pagination = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 50
    };

    const result = await this.auditService.getWorkshopAuditLogs(workshopId, filters, pagination);

    res.status(200).json({
      success: true,
      data: result.logs,
      total: result.total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: result.totalPages
    });
  });

  getRecentLogs = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { workshopId } = req.params;
    const { limit } = req.query;

    await this.checkAccess(workshopId, userId);

    const logs = await this.auditService.getRecentLogs(
      workshopId,
      limit ? parseInt(limit as string) : 50
    );

    res.status(200).json({
      success: true,
      data: logs
    });
  });

  getUserActivityLogs = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { workshopId, targetUserId } = req.params;
    const { page, limit } = req.query;

    await this.checkAccess(workshopId, userId);

    const pagination = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 50
    };

    const result = await this.auditService.getUserActivityLogs(workshopId, targetUserId, pagination);

    res.status(200).json({
      success: true,
      data: result.logs,
      total: result.total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: result.totalPages
    });
  });

  getTargetLogs = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { workshopId, targetId } = req.params;
    const { targetType, page, limit } = req.query;

    await this.checkAccess(workshopId, userId);

    const pagination = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 50
    };

    const result = await this.auditService.getTargetAuditLogs(
      workshopId,
      targetId,
      targetType as string | undefined,
      pagination
    );

    res.status(200).json({
      success: true,
      data: result.logs,
      total: result.total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: result.totalPages
    });
  });

  getAuditStats = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { workshopId } = req.params;

    await this.checkAccess(workshopId, userId);

    const stats = await this.auditService.getAuditStats(workshopId);

    res.status(200).json({
      success: true,
      data: stats
    });
  });

  getUserActivitySummary = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { workshopId, targetUserId } = req.params;
    const { days } = req.query;

    await this.checkAccess(workshopId, userId);

    const summary = await this.auditService.getUserActivitySummary(
      workshopId,
      targetUserId,
      days ? parseInt(days as string) : 30
    );

    res.status(200).json({
      success: true,
      data: summary
    });
  });
}
