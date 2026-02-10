import { IWorkshopTask, CreateWorkshopTaskDTO, UpdateWorkshopTaskDTO, ITaskAttachment } from '../types/index';

export interface TasksByStatus {
    [status: string]: IWorkshopTask[];
}

export interface IWorkshopTaskRepository {
    create(workshopId: string, projectId: string, taskData: CreateWorkshopTaskDTO, createdBy: string): Promise<IWorkshopTask>;
    findById(id: string): Promise<IWorkshopTask | null>;
    findByProject(projectId: string): Promise<IWorkshopTask[]>;
    findByProjectGroupedByStatus(projectId: string): Promise<TasksByStatus>;
    update(id: string, updates: UpdateWorkshopTaskDTO, updatedBy: string): Promise<IWorkshopTask>;
    updateStatus(id: string, status: string, updatedBy: string): Promise<IWorkshopTask>;
    addComment(taskId: string, userId: string, content: string, mentions?: string[]): Promise<IWorkshopTask>;
    addAttachment(taskId: string, userId: string, fileData: Omit<ITaskAttachment, '_id' | 'uploadedBy' | 'uploadedAt'>): Promise<IWorkshopTask>;
    assignTeam(taskId: string, teamId: string, assignedBy: string): Promise<IWorkshopTask>;
    assignIndividual(taskId: string, userId: string, assignedBy: string): Promise<IWorkshopTask>;
    delete(id: string, deletedBy: string): Promise<void>;
    deleteByProject(projectId: string): Promise<void>;
    findByAssignedUser(userId: string): Promise<IWorkshopTask[]>;
    findByAssignedTeam(teamId: string): Promise<IWorkshopTask[]>;
    countByProject(projectId: string): Promise<number>;
    countByStatus(projectId: string, status: string): Promise<number>;
}
