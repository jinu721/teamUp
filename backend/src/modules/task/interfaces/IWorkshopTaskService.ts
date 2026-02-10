import { IWorkshopTask, CreateWorkshopTaskDTO, UpdateWorkshopTaskDTO } from '../../../shared/types/index';
import { TasksByStatus } from './IWorkshopTaskRepository';
import { ISocketService } from '../../../shared/interfaces/ISocketService';

export interface IWorkshopTaskService {
    setSocketService(socketService: ISocketService): void;
    createTask(projectId: string, userId: string, data: CreateWorkshopTaskDTO): Promise<IWorkshopTask>;
    getTaskById(taskId: string, userId: string): Promise<IWorkshopTask>;
    getTaskActivities(taskId: string, userId: string): Promise<any[]>;
    getProjectTasks(projectId: string, userId: string): Promise<IWorkshopTask[]>;
    getProjectTaskBoard(projectId: string, userId: string): Promise<TasksByStatus>;
    updateTask(taskId: string, userId: string, updates: UpdateWorkshopTaskDTO): Promise<IWorkshopTask>;
    updateTaskStatus(taskId: string, userId: string, newStatus: string): Promise<IWorkshopTask>;
    assignTeamToTask(taskId: string, userId: string, teamId: string): Promise<IWorkshopTask>;
    assignIndividualToTask(taskId: string, userId: string, assigneeId: string): Promise<IWorkshopTask>;
    deleteTask(taskId: string, userId: string): Promise<void>;
    getUserTasks(userId: string): Promise<IWorkshopTask[]>;
    getTeamTasks(teamId: string, userId: string): Promise<IWorkshopTask[]>;
    addComment(taskId: string, userId: string, content: string, mentions?: string[]): Promise<IWorkshopTask>;
    addAttachment(taskId: string, userId: string, fileData: { fileName: string; fileUrl: string; fileType: string; fileSize: number }): Promise<IWorkshopTask>;
}
