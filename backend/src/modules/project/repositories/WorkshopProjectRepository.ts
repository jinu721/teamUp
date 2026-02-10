import { WorkshopProject } from '../models/WorkshopProject';
import { IWorkshopProject, CreateWorkshopProjectDTO, UpdateWorkshopProjectDTO } from '../types/index';
import { Types } from 'mongoose';
import { NotFoundError } from '../../../shared/utils/errors';
import { IWorkshopProjectRepository } from '../interfaces/IWorkshopProjectRepository';

export class WorkshopProjectRepository implements IWorkshopProjectRepository {
  private readonly populateAssignedTeams = { path: 'assignedTeams', select: 'name description members' };
  private readonly populateAssignedIndividuals = { path: 'assignedIndividuals', select: 'name email profilePhoto' };
  private readonly populateProjectManager = { path: 'projectManager', select: 'name email profilePhoto' };
  private readonly populateMaintainers = { path: 'maintainers', select: 'name email profilePhoto' };

  async create(workshopId: string, projectData: CreateWorkshopProjectDTO): Promise<IWorkshopProject> {
    const project = new WorkshopProject({
      ...projectData,
      workshop: new Types.ObjectId(workshopId)
    });
    const saved = await project.save();
    return await this.findById(saved._id.toString()) as IWorkshopProject;
  }

  async findById(id: string): Promise<IWorkshopProject | null> {
    return await WorkshopProject.findById(id)
      .populate(this.populateAssignedTeams)
      .populate(this.populateAssignedIndividuals)
      .populate(this.populateProjectManager)
      .populate(this.populateMaintainers);
  }

  async findByWorkshop(workshopId: string): Promise<IWorkshopProject[]> {
    return await WorkshopProject.find({ workshop: new Types.ObjectId(workshopId) })
      .populate(this.populateAssignedTeams)
      .populate(this.populateAssignedIndividuals)
      .populate(this.populateProjectManager)
      .populate(this.populateMaintainers)
      .sort({ updatedAt: -1 });
  }

  async update(id: string, updates: UpdateWorkshopProjectDTO): Promise<IWorkshopProject> {
    const project = await WorkshopProject.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate(this.populateAssignedTeams)
      .populate(this.populateAssignedIndividuals)
      .populate(this.populateProjectManager)
      .populate(this.populateMaintainers);

    if (!project) {
      throw new NotFoundError('Project');
    }

    return project;
  }

  async delete(id: string): Promise<void> {
    const result = await WorkshopProject.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundError('Project');
    }
  }

  async deleteByWorkshop(workshopId: string): Promise<void> {
    await WorkshopProject.deleteMany({ workshop: new Types.ObjectId(workshopId) });
  }

  async assignTeam(projectId: string, teamId: string): Promise<IWorkshopProject> {
    const project = await WorkshopProject.findByIdAndUpdate(
      projectId,
      { $addToSet: { assignedTeams: new Types.ObjectId(teamId) } },
      { new: true }
    )
      .populate(this.populateAssignedTeams)
      .populate(this.populateAssignedIndividuals)
      .populate(this.populateProjectManager)
      .populate(this.populateMaintainers);

    if (!project) {
      throw new NotFoundError('Project');
    }

    return project;
  }

  async removeTeam(projectId: string, teamId: string): Promise<IWorkshopProject> {
    const project = await WorkshopProject.findByIdAndUpdate(
      projectId,
      { $pull: { assignedTeams: new Types.ObjectId(teamId) } },
      { new: true }
    )
      .populate(this.populateAssignedTeams)
      .populate(this.populateAssignedIndividuals)
      .populate(this.populateProjectManager)
      .populate(this.populateMaintainers);

    if (!project) {
      throw new NotFoundError('Project');
    }

    return project;
  }

  async assignIndividual(projectId: string, userId: string): Promise<IWorkshopProject> {
    const project = await WorkshopProject.findByIdAndUpdate(
      projectId,
      { $addToSet: { assignedIndividuals: new Types.ObjectId(userId) } },
      { new: true }
    )
      .populate(this.populateAssignedTeams)
      .populate(this.populateAssignedIndividuals)
      .populate(this.populateProjectManager)
      .populate(this.populateMaintainers);

    if (!project) {
      throw new NotFoundError('Project');
    }

    return project;
  }

  async removeIndividual(projectId: string, userId: string): Promise<IWorkshopProject> {
    const project = await WorkshopProject.findByIdAndUpdate(
      projectId,
      { $pull: { assignedIndividuals: new Types.ObjectId(userId) } },
      { new: true }
    )
      .populate(this.populateAssignedTeams)
      .populate(this.populateAssignedIndividuals)
      .populate(this.populateProjectManager)
      .populate(this.populateMaintainers);

    if (!project) {
      throw new NotFoundError('Project');
    }

    return project;
  }

  async assignProjectManager(projectId: string, userId: string): Promise<IWorkshopProject> {
    const project = await WorkshopProject.findByIdAndUpdate(
      projectId,
      { $set: { projectManager: new Types.ObjectId(userId) } },
      { new: true }
    )
      .populate(this.populateAssignedTeams)
      .populate(this.populateAssignedIndividuals)
      .populate(this.populateProjectManager)
      .populate(this.populateMaintainers);

    if (!project) {
      throw new NotFoundError('Project');
    }

    return project;
  }

  async removeProjectManager(projectId: string): Promise<IWorkshopProject> {
    const project = await WorkshopProject.findByIdAndUpdate(
      projectId,
      { $unset: { projectManager: 1 } },
      { new: true }
    )
      .populate(this.populateAssignedTeams)
      .populate(this.populateAssignedIndividuals)
      .populate(this.populateProjectManager)
      .populate(this.populateMaintainers);

    if (!project) {
      throw new NotFoundError('Project');
    }

    return project;
  }

  async addMaintainer(projectId: string, userId: string): Promise<IWorkshopProject> {
    const project = await WorkshopProject.findByIdAndUpdate(
      projectId,
      { $addToSet: { maintainers: new Types.ObjectId(userId) } },
      { new: true }
    )
      .populate(this.populateAssignedTeams)
      .populate(this.populateAssignedIndividuals)
      .populate(this.populateProjectManager)
      .populate(this.populateMaintainers);

    if (!project) {
      throw new NotFoundError('Project');
    }

    return project;
  }

  async removeMaintainer(projectId: string, userId: string): Promise<IWorkshopProject> {
    const project = await WorkshopProject.findByIdAndUpdate(
      projectId,
      { $pull: { maintainers: new Types.ObjectId(userId) } },
      { new: true }
    )
      .populate(this.populateAssignedTeams)
      .populate(this.populateAssignedIndividuals)
      .populate(this.populateProjectManager)
      .populate(this.populateMaintainers);

    if (!project) {
      throw new NotFoundError('Project');
    }

    return project;
  }

  async isUserAssigned(projectId: string, userId: string): Promise<boolean> {
    const project = await WorkshopProject.findById(projectId);
    if (!project) return false;

    if (project.assignedIndividuals.some(i => i.toString() === userId)) return true;

    return false;
  }

  async addTeam(projectId: string, teamId: string): Promise<IWorkshopProject> {
    return await this.assignTeam(projectId, teamId);
  }

  async addIndividual(projectId: string, userId: string): Promise<IWorkshopProject> {
    return await this.assignIndividual(projectId, userId);
  }

  async findAccessibleByUser(workshopId: string, userId: string, teamIds: string[]): Promise<IWorkshopProject[]> {
    const teamObjectIds = teamIds.map(id => new Types.ObjectId(id));

    return await WorkshopProject.find({
      workshop: new Types.ObjectId(workshopId),
      $or: [
        { assignedIndividuals: new Types.ObjectId(userId) },
        { assignedTeams: { $in: teamObjectIds } }
      ]
    })
      .populate(this.populateAssignedTeams)
      .populate(this.populateAssignedIndividuals)
      .populate(this.populateProjectManager)
      .populate(this.populateMaintainers)
      .sort({ updatedAt: -1 });
  }

  async findAccessible(userId: string, workshopId: string, teamIds: string[] = []): Promise<IWorkshopProject[]> {
    const uId = new Types.ObjectId(userId);
    const wId = new Types.ObjectId(workshopId);
    const tIds = teamIds.map(id => new Types.ObjectId(id));

    return await WorkshopProject.find({
      workshop: wId,
      $or: [
        { assignedIndividuals: uId },
        { projectManager: uId },
        { maintainers: uId },
        { assignedTeams: { $in: tIds } }
      ]
    })
      .populate(this.populateAssignedTeams)
      .populate(this.populateAssignedIndividuals)
      .populate(this.populateProjectManager)
      .populate(this.populateMaintainers)
      .sort({ updatedAt: -1 });
  }

  async countByWorkshop(workshopId: string): Promise<number> {
    return await WorkshopProject.countDocuments({ workshop: new Types.ObjectId(workshopId) });
  }
}