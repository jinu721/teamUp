import { Workshop } from '../models/Workshop';
import { IWorkshop, CreateWorkshopDTO, UpdateWorkshopDTO, WorkshopVisibility } from '../types';
import { Types } from 'mongoose';
import { NotFoundError } from '../utils/errors';

export class WorkshopRepository {
  private readonly populateOwner = { path: 'owner', select: 'name email profilePhoto' };
  private readonly populateManagers = { path: 'managers', select: 'name email profilePhoto' };

  async create(ownerId: string, workshopData: CreateWorkshopDTO): Promise<IWorkshop> {
    const workshop = new Workshop({
      ...workshopData,
      owner: new Types.ObjectId(ownerId),
      managers: [] // Owner is not automatically a manager
    });
    const saved = await workshop.save();
    return await this.findById(saved._id.toString()) as IWorkshop;
  }

  async findById(id: string): Promise<IWorkshop | null> {
    return await Workshop.findById(id)
      .populate(this.populateOwner)
      .populate(this.populateManagers);
  }

  async findByUser(userId: string): Promise<IWorkshop[]> {
    return await Workshop.find({
      $or: [
        { owner: new Types.ObjectId(userId) },
        { managers: new Types.ObjectId(userId) }
      ]
    })
      .populate(this.populateOwner)
      .populate(this.populateManagers)
      .sort({ updatedAt: -1 });
  }

  async findPublic(options?: {
    search?: string;
    category?: string;
    tags?: string[];
    limit?: number;
    skip?: number;
    sort?: string;
  }): Promise<IWorkshop[]> {
    const query: any = { visibility: WorkshopVisibility.PUBLIC };

    if (options?.search) {
      query.$text = { $search: options.search };
    }

    if (options?.category) {
      query.category = options.category;
    }

    if (options?.tags && options.tags.length > 0) {
      query.tags = { $in: options.tags };
    }

    let queryBuilder = Workshop.find(query)
      .populate(this.populateOwner)
      .populate(this.populateManagers);

    if (options?.sort === 'top') {
      queryBuilder = queryBuilder.sort({ voteScore: -1, createdAt: -1 });
    } else if (options?.sort === 'trending') {
      // Basic trending: voteScore descending, then date
      queryBuilder = queryBuilder.sort({ voteScore: -1, createdAt: -1 });
    } else if (options?.search) {
      queryBuilder = queryBuilder.sort({ score: { $meta: 'textScore' } });
    } else {
      queryBuilder = queryBuilder.sort({ createdAt: -1 });
    }

    if (options?.skip) {
      queryBuilder = queryBuilder.skip(options.skip);
    }

    if (options?.limit) {
      queryBuilder = queryBuilder.limit(options.limit);
    }

    return await queryBuilder;
  }

  async countPublic(options?: { search?: string; category?: string; tags?: string[] }): Promise<number> {
    const query: any = { visibility: WorkshopVisibility.PUBLIC };

    if (options?.search) {
      query.$text = { $search: options.search };
    }

    if (options?.category) {
      query.category = options.category;
    }

    if (options?.tags && options.tags.length > 0) {
      query.tags = { $in: options.tags };
    }

    return await Workshop.countDocuments(query);
  }

  async update(id: string, updates: UpdateWorkshopDTO): Promise<IWorkshop> {
    const workshop = await Workshop.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate(this.populateOwner)
      .populate(this.populateManagers);

    if (!workshop) {
      throw new NotFoundError('Workshop');
    }

    return workshop;
  }

  async delete(id: string): Promise<void> {
    const result = await Workshop.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundError('Workshop');
    }
  }

  async addManager(workshopId: string, managerId: string): Promise<IWorkshop> {
    const workshop = await Workshop.findByIdAndUpdate(
      workshopId,
      { $addToSet: { managers: new Types.ObjectId(managerId) } },
      { new: true }
    )
      .populate(this.populateOwner)
      .populate(this.populateManagers);

    if (!workshop) {
      throw new NotFoundError('Workshop');
    }

    return workshop;
  }

  async removeManager(workshopId: string, managerId: string): Promise<IWorkshop> {
    const workshop = await Workshop.findByIdAndUpdate(
      workshopId,
      { $pull: { managers: new Types.ObjectId(managerId) } },
      { new: true }
    )
      .populate(this.populateOwner)
      .populate(this.populateManagers);

    if (!workshop) {
      throw new NotFoundError('Workshop');
    }

    return workshop;
  }

  async isOwner(workshopId: string, userId: string): Promise<boolean> {
    const workshop = await Workshop.findById(workshopId);
    return workshop?.owner.toString() === userId;
  }

  async isManager(workshopId: string, userId: string): Promise<boolean> {
    const workshop = await Workshop.findById(workshopId);
    return workshop?.managers.some(m => m.toString() === userId) || false;
  }

  async isOwnerOrManager(workshopId: string, userId: string): Promise<boolean> {
    const workshop = await Workshop.findById(workshopId);
    if (!workshop) return false;

    return workshop.owner.toString() === userId ||
      workshop.managers.some(m => m.toString() === userId);
  }

  async getManagerCount(workshopId: string): Promise<number> {
    const workshop = await Workshop.findById(workshopId);
    return workshop?.managers.length || 0;
  }

  async searchPublic(searchTerm: string, limit: number = 20): Promise<IWorkshop[]> {
    return await Workshop.find({
      visibility: WorkshopVisibility.PUBLIC,
      $text: { $search: searchTerm }
    })
      .populate(this.populateOwner)
      .populate(this.populateManagers)
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit);
  }

  async incrementVote(workshopId: string, amount: number, isUpvote: boolean): Promise<IWorkshop> {
    const update: any = { $inc: { voteScore: amount } };
    if (isUpvote) {
      update.$inc.upvoteCount = 1;
    } else {
      update.$inc.downvoteCount = 1;
    }

    const workshop = await Workshop.findByIdAndUpdate(
      workshopId,
      update,
      { new: true }
    )
      .populate(this.populateOwner)
      .populate(this.populateManagers);

    if (!workshop) {
      throw new NotFoundError('Workshop');
    }

    return workshop;
  }

  async updateVoteStats(workshopId: string, upvotes: number, downvotes: number): Promise<IWorkshop> {
    const workshop = await Workshop.findByIdAndUpdate(
      workshopId,
      {
        $set: {
          upvoteCount: upvotes,
          downvoteCount: downvotes,
          voteScore: upvotes - downvotes
        }
      },
      { new: true }
    )
      .populate(this.populateOwner)
      .populate(this.populateManagers);

    if (!workshop) {
      throw new NotFoundError('Workshop');
    }

    return workshop;
  }
}