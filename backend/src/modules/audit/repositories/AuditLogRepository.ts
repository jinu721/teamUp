import { Types } from 'mongoose';
import { AuditLog } from '../models/AuditLog';
import { IAuditLog, AuditAction, AuditLogFilters, Pagination } from '../../../shared/types/index';
import { IAuditLogRepository } from '../interfaces/IAuditLogRepository';

export class AuditLogRepository implements IAuditLogRepository {
  private readonly populateActor = { path: 'actor', select: 'name email profilePhoto' };
  private readonly populateWorkshop = { path: 'workshop', select: 'name' };

  async create(data: {
    workshopId: string;
    action: AuditAction;
    actorId: string;
    targetId?: string;
    targetType?: string;
    details?: Record<string, unknown>;
  }): Promise<IAuditLog> {
    const auditLog = new AuditLog({
      workshop: Types.ObjectId.isValid(data.workshopId) ? new Types.ObjectId(data.workshopId) : undefined,
      action: data.action,
      actor: Types.ObjectId.isValid(data.actorId) ? new Types.ObjectId(data.actorId) : undefined,
      target: (data.targetId && Types.ObjectId.isValid(data.targetId)) ? new Types.ObjectId(data.targetId) : undefined,
      targetType: data.targetType,
      details: data.details || {},
      timestamp: new Date()
    });

    return await auditLog.save();
  }

  async findById(id: string): Promise<IAuditLog | null> {
    return await AuditLog.findById(id)
      .populate(this.populateActor)
      .populate(this.populateWorkshop);
  }

  async findByWorkshop(
    workshopId: string,
    filters?: AuditLogFilters,
    pagination?: Pagination
  ): Promise<{ logs: IAuditLog[]; total: number }> {
    const query: Record<string, unknown> = {
      workshop: new Types.ObjectId(workshopId)
    };

    if (filters?.action) {
      query.action = filters.action;
    }
    if (filters?.actor) {
      query.actor = new Types.ObjectId(filters.actor);
    }
    if (filters?.target) {
      query.target = new Types.ObjectId(filters.target);
    }
    if (filters?.targetType) {
      query.targetType = filters.targetType;
    }
    if (filters?.startDate || filters?.endDate) {
      query.timestamp = {};
      if (filters.startDate) {
        (query.timestamp as Record<string, Date>).$gte = filters.startDate;
      }
      if (filters.endDate) {
        (query.timestamp as Record<string, Date>).$lte = filters.endDate;
      }
    }

    const total = await AuditLog.countDocuments(query);
    let queryBuilder = AuditLog.find(query)
      .populate(this.populateActor)
      .sort({ timestamp: -1 });

    if (pagination) {
      const skip = (pagination.page - 1) * pagination.limit;
      queryBuilder = queryBuilder.skip(skip).limit(pagination.limit);
    }

    const logs = await queryBuilder;

    return { logs, total };
  }

  async findByActor(
    workshopId: string,
    actorId: string,
    pagination?: Pagination
  ): Promise<{ logs: IAuditLog[]; total: number }> {
    return await this.findByWorkshop(
      workshopId,
      { actor: actorId },
      pagination
    );
  }

  async findByTarget(
    workshopId: string,
    targetId: string,
    targetType?: string,
    pagination?: Pagination
  ): Promise<{ logs: IAuditLog[]; total: number }> {
    const filters: AuditLogFilters = { target: targetId };
    if (targetType) {
      filters.targetType = targetType;
    }
    return await this.findByWorkshop(workshopId, filters, pagination);
  }

  async findByAction(
    workshopId: string,
    action: AuditAction,
    pagination?: Pagination
  ): Promise<{ logs: IAuditLog[]; total: number }> {
    return await this.findByWorkshop(
      workshopId,
      { action },
      pagination
    );
  }

  async findRecent(workshopId: string, limit: number = 50): Promise<IAuditLog[]> {
    return await AuditLog.find({ workshop: new Types.ObjectId(workshopId) })
      .populate(this.populateActor)
      .sort({ timestamp: -1 })
      .limit(limit);
  }

  async findByDateRange(
    workshopId: string,
    startDate: Date,
    endDate: Date,
    pagination?: Pagination
  ): Promise<{ logs: IAuditLog[]; total: number }> {
    return await this.findByWorkshop(
      workshopId,
      { startDate, endDate },
      pagination
    );
  }

  async countByAction(workshopId: string): Promise<Record<string, number>> {
    const result = await AuditLog.aggregate([
      { $match: { workshop: new Types.ObjectId(workshopId) } },
      { $group: { _id: '$action', count: { $sum: 1 } } }
    ]);

    return result.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as Record<string, number>);
  }

  async getUserActivitySummary(
    workshopId: string,
    userId: string,
    days: number = 30
  ): Promise<{ action: string; count: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await AuditLog.aggregate([
      {
        $match: {
          workshop: new Types.ObjectId(workshopId),
          actor: new Types.ObjectId(userId),
          timestamp: { $gte: startDate }
        }
      },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    return result.map(item => ({
      action: item._id,
      count: item.count
    }));
  }

  async update(): Promise<never> {
    throw new Error('Audit logs are immutable and cannot be updated');
  }

  async delete(): Promise<never> {
    throw new Error('Audit logs are immutable and cannot be deleted');
  }

  async deleteByWorkshop(): Promise<never> {
    throw new Error('Audit logs are immutable and cannot be deleted');
  }
}