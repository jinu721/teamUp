import { MessageRepository } from '../repositories/MessageRepository';
import { ProjectRepository } from '../repositories/ProjectRepository';
import { IMessage } from '../types';
import { NotFoundError, AuthorizationError } from '../utils/errorHandler';
import { SocketService } from './SocketService';

export class MessageService {
  private messageRepository: MessageRepository;
  private projectRepository: ProjectRepository;
  private socketService: SocketService | null = null;

  constructor() {
    this.messageRepository = new MessageRepository();
    this.projectRepository = new ProjectRepository();
  }

  setSocketService(socketService: SocketService): void {
    this.socketService = socketService;
  }

  async sendMessage(
    projectId: string,
    userId: string,
    content: string,
    attachments: string[] = []
  ): Promise<IMessage> {
    const isMember = await this.projectRepository.isUserMember(projectId, userId);
    if (!isMember) {
      throw new AuthorizationError('You are not a member of this project');
    }

    const message = await this.messageRepository.create({
      project: projectId as any,
      sender: userId as any,
      content,
      attachments
    } as any);

    if (this.socketService) {
      this.socketService.emitToProject(projectId, 'message:new', message);
    }

    return message;
  }

  async getProjectMessages(projectId: string, userId: string, limit: number = 50): Promise<IMessage[]> {
    const isMember = await this.projectRepository.isUserMember(projectId, userId);
    if (!isMember) {
      throw new AuthorizationError('You are not a member of this project');
    }

    return await this.messageRepository.findByProjectId(projectId, limit);
  }
}
