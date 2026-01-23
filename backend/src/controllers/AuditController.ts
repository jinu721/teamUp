import { Response } from 'express';
import { AuditService } from '../services/AuditService';
import { WorkshopRepository } from '../repositories/WorkshopRepository';
import { AuthRequest, AuditAction } from '../types';
import { AuthorizationError } from '../utils/errors';
import { asyncHandler } from '../middlewares/errorMiddleware';

export class AuditController {
  private auditService: AuditService;
  private workshopRepository: WorkshopRepository;

  constructor() {
    this.auditService = new AuditService();
    this.workshopRepository = new WorkshopRepository();
  }

  getAuditLogs = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { workshopId } = req.params;
    const { action, actor, target, targetType, startDate, endDate, page, limit } = req.query;

    const canView = await this.workshopRepository.isOwnerOrManager(workshopId, userId);
    if (!canView) {
      throw new AuthorizationError('Only workshop owner or managers can view audit logs');
    }

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
      totalPages: Math.ceil(result.total / pagination.limit)
    });
  });

  getRecentLogs = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { workshopId } = req.params;
    const { limit } = req.query;

    const canView = await this.workshopRepository.isOwnerOrManager(workshopId, userId);
    if (!canView) {
      throw new AuthorizationError('Only workshop owner or managers can view audit logs');
    }

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

    const canView = await this.workshopRepository.isOwnerOrManager(workshopId, userId);
    if (!canView) {
      throw new AuthorizationError('Only workshop owner or managers can view audit logs');
    }

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
      limit: pagination.limit
    });
  });

  getTargetLogs = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { workshopId, targetId } = req.params;
    const { targetType, page, limit } = req.query;

    const canView = await this.workshopRepository.isOwnerOrManager(workshopId, userId);
    if (!canView) {
      throw new AuthorizationError('Only workshop owner or managers can view audit logs');
    }

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
      limit: pagination.limit
    });
  });

  getAuditStats = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { workshopId } = req.params;

    const canView = await this.workshopRepository.isOwnerOrManager(workshopId, userId);
    if (!canView) {
      throw new AuthorizationError('Only workshop owner or managers can view audit logs');
    }

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

    const canView = await this.workshopRepository.isOwnerOrManager(workshopId, userId);
    if (!canView) {
      throw new AuthorizationError('Only workshop owner or managers can view audit logs');
    }

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