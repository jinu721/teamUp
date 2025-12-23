import { TaskRepository } from '../repositories/TaskRepository';
import { ProjectRepository } from '../repositories/ProjectRepository';
import { NotificationRepository } from '../repositories/NotificationRepository';
import { ITask, TaskStatus, NotificationType } from '../types';
import { NotFoundError, AuthorizationError } from '../utils/errorHandler';
import { SocketService } from './SocketService';

export class TaskService {
  private taskRepository: TaskRepository;
  private projectRepository: ProjectRepository;
  private notificationRepository: NotificationRepository;
  private socketService: SocketService | null = null;

  constructor() {
    this.taskRepository = new TaskRepository();
    this.projectRepository = new ProjectRepository();
    this.notificationRepository = new NotificationRepository();
  }

  setSocketService(socketService: SocketService): void {
    this.socketService = socketService;
  }

  async createTask(
    projectId: string,
    userId: string,
    title: string,
    description?: string,
    assignedTo?: string,
    dueDate?: Date
  ): Promise<ITask> {
    const isMember = await this.projectRepository.isUserMember(projectId, userId);
    if (!isMember) {
      throw new AuthorizationError('You are not a member of this project');
    }

    const task = await this.taskRepository.create({
      project: projectId as any,
      title,
      description,
      status: TaskStatus.TODO,
      assignedTo: assignedTo as any,
      createdBy: userId as any,
      dueDate,
      attachments: []
    } as any);

    if (assignedTo && assignedTo !== userId) {
      await this.notificationRepository.create({
        user: assignedTo as any,
        type: NotificationType.TASK_ASSIGNED,
        title: 'New Task Assigned',
        message: `You have been assigned to task: ${title}`,
        relatedProject: projectId as any,
        relatedTask: task._id,
        isRead: false
      } as any);

      if (this.socketService) {
        this.socketService.emitToUser(assignedTo, 'notification:new', {
          type: 'task_assigned',
          title: 'New Task Assigned',
          message: `You have been assigned to task: ${title}`
        });
      }
    }

    if (this.socketService) {
      this.socketService.emitToProject(projectId, 'task:created', task);
    }

    return task;
  }

  async getProjectTasks(projectId: string, userId: string): Promise<ITask[]> {
    const isMember = await this.projectRepository.isUserMember(projectId, userId);
    if (!isMember) {
      throw new AuthorizationError('You are not a member of this project');
    }

    return await this.taskRepository.findByProjectId(projectId);
  }

  async updateTask(taskId: string, userId: string, updates: Partial<ITask>): Promise<ITask> {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    const isMember = await this.projectRepository.isUserMember(task.project.toString(), userId);
    if (!isMember) {
      throw new AuthorizationError('You are not a member of this project');
    }

    const updatedTask = await this.taskRepository.update(taskId, updates);
    if (!updatedTask) {
      throw new NotFoundError('Task not found');
    }

    if (this.socketService) {
      this.socketService.emitToProject(task.project.toString(), 'task:updated', updatedTask);
    }

    return updatedTask;
  }

  async updateTaskStatus(taskId: string, userId: string, status: TaskStatus): Promise<ITask> {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    const isMember = await this.projectRepository.isUserMember(task.project.toString(), userId);
    if (!isMember) {
      throw new AuthorizationError('You are not a member of this project');
    }

    const updatedTask = await this.taskRepository.updateStatus(taskId, status);
    if (!updatedTask) {
      throw new NotFoundError('Task not found');
    }

    if (this.socketService) {
      this.socketService.emitToProject(task.project.toString(), 'task:moved', {
        task: updatedTask,
        oldStatus: task.status,
        newStatus: status
      });
    }

    return updatedTask;
  }

  async deleteTask(taskId: string, userId: string): Promise<void> {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    const isMember = await this.projectRepository.isUserMember(task.project.toString(), userId);
    if (!isMember) {
      throw new AuthorizationError('You are not a member of this project');
    }

    await this.taskRepository.delete(taskId);

    if (this.socketService) {
      this.socketService.emitToProject(task.project.toString(), 'task:deleted', { taskId });
    }
  }
}
