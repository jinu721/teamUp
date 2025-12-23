import { ProjectRepository } from '../repositories/ProjectRepository';
import { UserRepository } from '../repositories/UserRepository';
import { IProject, ProjectCategory } from '../types';
import { NotFoundError, AuthorizationError, ValidationError } from '../utils/errorHandler';
import { SocketService } from './SocketService';

export class ProjectService {
  private projectRepository: ProjectRepository;
  private userRepository: UserRepository;
  private socketService: SocketService | null = null;

  constructor() {
    this.projectRepository = new ProjectRepository();
    this.userRepository = new UserRepository();
  }

  setSocketService(socketService: SocketService): void {
    this.socketService = socketService;
  }

  async createProject(
    userId: string,
    title: string,
    description: string,
    category: ProjectCategory,
    startDate: Date,
    endDate?: Date
  ): Promise<IProject> {
    const project = await this.projectRepository.create({
      title,
      description,
      category,
      owner: userId as any,
      teamMembers: [userId as any],
      startDate,
      endDate,
      isPublic: false
    } as any);

    return project;
  }

  async getProjectById(projectId: string, userId: string): Promise<IProject> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const isMember = await this.projectRepository.isUserMember(projectId, userId);
    if (!isMember) {
      throw new AuthorizationError('You are not a member of this project');
    }

    return project;
  }

  async getUserProjects(userId: string): Promise<IProject[]> {
    return await this.projectRepository.findByUserId(userId);
  }

  async updateProject(
    projectId: string,
    userId: string,
    updates: Partial<IProject>
  ): Promise<IProject> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    if (project.owner.toString() !== userId) {
      throw new AuthorizationError('Only project owner can update project');
    }

    const updatedProject = await this.projectRepository.update(projectId, updates);
    if (!updatedProject) {
      throw new NotFoundError('Project not found');
    }

    if (this.socketService) {
      this.socketService.emitToProject(projectId, 'project:updated', updatedProject);
    }

    return updatedProject;
  }

  async deleteProject(projectId: string, userId: string): Promise<void> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    if (project.owner.toString() !== userId) {
      throw new AuthorizationError('Only project owner can delete project');
    }

    await this.projectRepository.delete(projectId);
  }

  async inviteTeamMember(projectId: string, userId: string, inviteeEmail: string): Promise<IProject> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    if (project.owner.toString() !== userId) {
      throw new AuthorizationError('Only project owner can invite members');
    }

    const invitee = await this.userRepository.findByEmailWithoutPassword(inviteeEmail);
    if (!invitee) {
      throw new NotFoundError('User not found');
    }

    const updatedProject = await this.projectRepository.addTeamMember(projectId, invitee._id.toString());
    if (!updatedProject) {
      throw new NotFoundError('Project not found');
    }

    if (this.socketService) {
      this.socketService.emitToUser(invitee._id.toString(), 'notification:new', {
        type: 'project_invite',
        title: 'Project Invitation',
        message: `You have been invited to join ${project.title}`,
        relatedProject: projectId
      });

      this.socketService.emitToProject(projectId, 'project:updated', updatedProject);
    }

    return updatedProject;
  }

  async removeTeamMember(projectId: string, userId: string, memberId: string): Promise<IProject> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    if (project.owner.toString() !== userId) {
      throw new AuthorizationError('Only project owner can remove members');
    }

    const updatedProject = await this.projectRepository.removeTeamMember(projectId, memberId);
    if (!updatedProject) {
      throw new NotFoundError('Project not found');
    }

    if (this.socketService) {
      this.socketService.emitToProject(projectId, 'project:updated', updatedProject);
    }

    return updatedProject;
  }
}
