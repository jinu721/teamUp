import { CommunityProjectRepository } from '../repositories/CommunityProjectRepository';
import { NotificationRepository } from '../repositories/NotificationRepository';
import { ICommunityProject, NotificationType } from '../types';
import { NotFoundError, AuthorizationError } from '../utils/errorHandler';
import { SocketService } from './SocketService';

export class CommunityService {
  private communityProjectRepository: CommunityProjectRepository;
  private notificationRepository: NotificationRepository;
  private socketService: SocketService | null = null;

  constructor() {
    this.communityProjectRepository = new CommunityProjectRepository();
    this.notificationRepository = new NotificationRepository();
  }

  setSocketService(socketService: SocketService): void {
    this.socketService = socketService;
  }

  async createCommunityProject(
    userId: string,
    title: string,
    description: string,
    tags: string[],
    requiredSkills: string[]
  ): Promise<ICommunityProject> {
    const project = await this.communityProjectRepository.create({
      title,
      description,
      tags,
      requiredSkills,
      owner: userId as any,
      likes: [],
      comments: [],
      joinRequests: []
    } as any);

    if (this.socketService) {
      this.socketService.emitToCommunity('community:project:new', project);
    }

    return project;
  }

  async getCommunityProjects(limit: number = 20, skip: number = 0): Promise<ICommunityProject[]> {
    return await this.communityProjectRepository.findAll(limit, skip);
  }

  async getCommunityProjectById(projectId: string): Promise<ICommunityProject> {
    const project = await this.communityProjectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError('Community project not found');
    }
    return project;
  }

  async likeProject(projectId: string, userId: string): Promise<ICommunityProject> {
    const project = await this.communityProjectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError('Community project not found');
    }

    const updatedProject = await this.communityProjectRepository.addLike(projectId, userId);
    if (!updatedProject) {
      throw new NotFoundError('Community project not found');
    }

    if (this.socketService) {
      this.socketService.emitToCommunity('community:project:liked', {
        projectId,
        userId,
        likesCount: updatedProject.likes.length
      });
    }

    return updatedProject;
  }

  async unlikeProject(projectId: string, userId: string): Promise<ICommunityProject> {
    const project = await this.communityProjectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError('Community project not found');
    }

    const updatedProject = await this.communityProjectRepository.removeLike(projectId, userId);
    if (!updatedProject) {
      throw new NotFoundError('Community project not found');
    }

    if (this.socketService) {
      this.socketService.emitToCommunity('community:project:liked', {
        projectId,
        userId,
        likesCount: updatedProject.likes.length
      });
    }

    return updatedProject;
  }

  async commentOnProject(projectId: string, userId: string, content: string): Promise<ICommunityProject> {
    const project = await this.communityProjectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError('Community project not found');
    }

    const updatedProject = await this.communityProjectRepository.addComment(projectId, userId, content);
    if (!updatedProject) {
      throw new NotFoundError('Community project not found');
    }

    if (project.owner.toString() !== userId) {
      await this.notificationRepository.create({
        user: project.owner as any,
        type: NotificationType.COMMENT,
        title: 'New Comment',
        message: `Someone commented on your project: ${project.title}`,
        relatedUser: userId as any,
        isRead: false
      } as any);

      if (this.socketService) {
        this.socketService.emitToUser(project.owner.toString(), 'notification:new', {
          type: 'comment',
          title: 'New Comment',
          message: `Someone commented on your project: ${project.title}`
        });
      }
    }

    if (this.socketService) {
      this.socketService.emitToCommunity('community:project:commented', {
        projectId,
        comment: updatedProject.comments[updatedProject.comments.length - 1]
      });
    }

    return updatedProject;
  }

  async requestToJoin(projectId: string, userId: string): Promise<ICommunityProject> {
    const project = await this.communityProjectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError('Community project not found');
    }

    const updatedProject = await this.communityProjectRepository.addJoinRequest(projectId, userId);
    if (!updatedProject) {
      throw new NotFoundError('Community project not found');
    }

    await this.notificationRepository.create({
      user: project.owner as any,
      type: NotificationType.JOIN_REQUEST,
      title: 'Join Request',
      message: `Someone wants to join your project: ${project.title}`,
      relatedUser: userId as any,
      isRead: false
    } as any);

    if (this.socketService) {
      this.socketService.emitToUser(project.owner.toString(), 'notification:new', {
        type: 'join_request',
        title: 'Join Request',
        message: `Someone wants to join your project: ${project.title}`
      });

      this.socketService.emitToCommunity('community:project:join-request', {
        projectId,
        userId
      });
    }

    return updatedProject;
  }

  async searchByTags(tags: string[]): Promise<ICommunityProject[]> {
    return await this.communityProjectRepository.findByTags(tags);
  }

  async searchBySkills(skills: string[]): Promise<ICommunityProject[]> {
    return await this.communityProjectRepository.findBySkills(skills);
  }
}
