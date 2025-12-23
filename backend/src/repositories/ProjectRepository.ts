import { Project } from '../models/Project';
import { IProject } from '../types';
import { Types } from 'mongoose';

export class ProjectRepository {
  async create(projectData: Partial<IProject>): Promise<IProject> {
    const project = new Project(projectData);
    return await project.save();
  }

  async findById(id: string): Promise<IProject | null> {
    return await Project.findById(id)
      .populate('owner', 'name email profilePhoto')
      .populate('teamMembers', 'name email profilePhoto skills');
  }

  async findByUserId(userId: string): Promise<IProject[]> {
    return await Project.find({
      $or: [
        { owner: new Types.ObjectId(userId) },
        { teamMembers: new Types.ObjectId(userId) }
      ]
    })
      .populate('owner', 'name email profilePhoto')
      .populate('teamMembers', 'name email profilePhoto')
      .sort({ updatedAt: -1 });
  }

  async update(id: string, updates: Partial<IProject>): Promise<IProject | null> {
    return await Project.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('owner', 'name email profilePhoto')
      .populate('teamMembers', 'name email profilePhoto skills');
  }

  async delete(id: string): Promise<IProject | null> {
    return await Project.findByIdAndDelete(id);
  }

  async addTeamMember(projectId: string, userId: string): Promise<IProject | null> {
    return await Project.findByIdAndUpdate(
      projectId,
      { $addToSet: { teamMembers: new Types.ObjectId(userId) } },
      { new: true }
    )
      .populate('owner', 'name email profilePhoto')
      .populate('teamMembers', 'name email profilePhoto skills');
  }

  async removeTeamMember(projectId: string, userId: string): Promise<IProject | null> {
    return await Project.findByIdAndUpdate(
      projectId,
      { $pull: { teamMembers: new Types.ObjectId(userId) } },
      { new: true }
    )
      .populate('owner', 'name email profilePhoto')
      .populate('teamMembers', 'name email profilePhoto skills');
  }

  async isUserMember(projectId: string, userId: string): Promise<boolean> {
    const project = await Project.findOne({
      _id: new Types.ObjectId(projectId),
      $or: [
        { owner: new Types.ObjectId(userId) },
        { teamMembers: new Types.ObjectId(userId) }
      ]
    });
    return !!project;
  }
}
