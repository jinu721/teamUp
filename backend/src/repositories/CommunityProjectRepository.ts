import { CommunityProject } from '../models/CommunityProject';
import { ICommunityProject } from '../types';
import { Types } from 'mongoose';

export class CommunityProjectRepository {
  async create(projectData: Partial<ICommunityProject>): Promise<ICommunityProject> {
    const project = new CommunityProject(projectData);
    return await project.save();
  }

  async findById(id: string): Promise<ICommunityProject | null> {
    return await CommunityProject.findById(id)
      .populate('owner', 'name email profilePhoto skills')
      .populate('comments.user', 'name email profilePhoto');
  }

  async findAll(limit: number = 20, skip: number = 0): Promise<ICommunityProject[]> {
    return await CommunityProject.find()
      .populate('owner', 'name email profilePhoto skills')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
  }

  async findByTags(tags: string[]): Promise<ICommunityProject[]> {
    return await CommunityProject.find({
      tags: { $in: tags }
    })
      .populate('owner', 'name email profilePhoto skills')
      .sort({ createdAt: -1 })
      .limit(20);
  }

  async findBySkills(skills: string[]): Promise<ICommunityProject[]> {
    return await CommunityProject.find({
      requiredSkills: { $in: skills }
    })
      .populate('owner', 'name email profilePhoto skills')
      .sort({ createdAt: -1 })
      .limit(20);
  }

  async update(id: string, updates: Partial<ICommunityProject>): Promise<ICommunityProject | null> {
    return await CommunityProject.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('owner', 'name email profilePhoto skills')
      .populate('comments.user', 'name email profilePhoto');
  }

  async delete(id: string): Promise<ICommunityProject | null> {
    return await CommunityProject.findByIdAndDelete(id);
  }

  async addLike(projectId: string, userId: string): Promise<ICommunityProject | null> {
    return await CommunityProject.findByIdAndUpdate(
      projectId,
      { $addToSet: { likes: new Types.ObjectId(userId) } },
      { new: true }
    )
      .populate('owner', 'name email profilePhoto skills');
  }

  async removeLike(projectId: string, userId: string): Promise<ICommunityProject | null> {
    return await CommunityProject.findByIdAndUpdate(
      projectId,
      { $pull: { likes: new Types.ObjectId(userId) } },
      { new: true }
    )
      .populate('owner', 'name email profilePhoto skills');
  }

  async addComment(projectId: string, userId: string, content: string): Promise<ICommunityProject | null> {
    return await CommunityProject.findByIdAndUpdate(
      projectId,
      { 
        $push: { 
          comments: { 
            user: new Types.ObjectId(userId), 
            content,
            createdAt: new Date()
          } 
        } 
      },
      { new: true }
    )
      .populate('owner', 'name email profilePhoto skills')
      .populate('comments.user', 'name email profilePhoto');
  }

  async addJoinRequest(projectId: string, userId: string): Promise<ICommunityProject | null> {
    return await CommunityProject.findByIdAndUpdate(
      projectId,
      { $addToSet: { joinRequests: new Types.ObjectId(userId) } },
      { new: true }
    )
      .populate('owner', 'name email profilePhoto skills');
  }
}
