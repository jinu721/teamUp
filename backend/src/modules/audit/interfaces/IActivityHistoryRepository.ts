import { IActivityHistory } from '../models/ActivityHistory';
import { FilterQuery } from 'mongoose';

export interface IActivityHistoryRepository {
    create(data: any): Promise<IActivityHistory>;
    find(query: FilterQuery<IActivityHistory>, options?: { skip?: number; limit?: number; sort?: any; populate?: any }): Promise<IActivityHistory[]>;
    findById(id: string): Promise<IActivityHistory | null>;
    countDocuments(query: FilterQuery<IActivityHistory>): Promise<number>;
    deleteMany(query: FilterQuery<IActivityHistory>): Promise<{ deletedCount: number }>;
    aggregate(pipeline: any[]): Promise<any[]>;
}
