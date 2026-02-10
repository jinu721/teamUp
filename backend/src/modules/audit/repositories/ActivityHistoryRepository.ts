import { ActivityHistory } from '../models/ActivityHistory';
import { IActivityHistory } from '../types/index';
import { FilterQuery } from 'mongoose';
import { IActivityHistoryRepository } from '../interfaces/IActivityHistoryRepository';

export class ActivityHistoryRepository implements IActivityHistoryRepository {
    async create(data: any): Promise<IActivityHistory> {
        return ActivityHistory.create(data);
    }

    async find(query: FilterQuery<IActivityHistory>, options: { skip?: number; limit?: number; sort?: any; populate?: any } = {}): Promise<IActivityHistory[]> {
        let q: any = ActivityHistory.find(query);
        if (options.populate) q = q.populate(options.populate as any);
        if (options.sort) q = q.sort(options.sort);
        if (options.skip) q = q.skip(options.skip);
        if (options.limit) q = q.limit(options.limit);
        return q;
    }

    async findById(id: string): Promise<IActivityHistory | null> {
        return ActivityHistory.findById(id);
    }

    async countDocuments(query: FilterQuery<IActivityHistory>): Promise<number> {
        return ActivityHistory.countDocuments(query);
    }

    async deleteMany(query: FilterQuery<IActivityHistory>): Promise<{ deletedCount: number }> {
        const result = await ActivityHistory.deleteMany(query);
        return { deletedCount: result.deletedCount || 0 };
    }

    async aggregate(pipeline: any[]): Promise<any[]> {
        return ActivityHistory.aggregate(pipeline);
    }
}
