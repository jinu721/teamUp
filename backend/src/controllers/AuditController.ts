import { Response } from 'express';
import { AuditService } from '../services/AuditService';
import { WorkshopRepository } from '../repositories/WorkshopRepository';
import { AuthRequest, AuditAction } from '../types';
import { AuthorizationError } from '../utils/errors';
import { asyncHandler } from '../middlewares/errorMiddleware';

/**
 * Audit Controller
 * Handles all HTTP requests for audit log access
 */
export class AuditController {
  private auditService: AuditService;
  private workshopRepository: WorkshopRepository;

  constructor() {
    this.auditService = new AuditService();
    this.workshopRepository = new WorkshopRepository();
  }

  /**
   * GET /api/workshops/:workshopId/audit
   * Get audit logs for a workshop with filters and pagination
   */
  getAuditLogs = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { workshopId } = req.params;
    const { action, actor, target, targetType, startDate, endDate, page, limit } = req.query;

    // Check permission - only owner or manager can view audit logs
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

  /**
   * GET /api/workshops/:workshopId/audit/recent
   * Get recent audit logs for a workshop
   */
  getRecentLogs = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { workshopId } = req.params;
    const { limit } = req.query;

    // Check permission
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

  /**
   * GET /api/workshops/:workshopId/audit/user/:targetUserId
   * Get audit logs for a specific user's activity
   */
  getUserActivityLogs = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { workshopId, targetUserId } = req.params;
    const { page, limit } = req.query;

    // Check permission
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

  /**
   * GET /api/workshops/:workshopId/audit/target/:targetId
   * Get audit logs for a specific target entity
   */
  getTargetLogs = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { workshopId, targetId } = req.params;
    const { targetType, page, limit } = req.query;

    // Check permission
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

  /**
   * GET /api/workshops/:workshopId/audit/stats
   * Get audit log statistics
   */
  getAuditStats = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { workshopId } = req.params;

    // Check permission
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

  /**
   * GET /api/workshops/:workshopId/audit/user/:targetUserId/summary
   * Get activity summary for a user
   */
  getUserActivitySummary = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { workshopId, targetUserId } = req.params;
    const { days } = req.query;

    // Check permission
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
