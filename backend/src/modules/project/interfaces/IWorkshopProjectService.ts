import {
    IWorkshopProject,
    CreateWorkshopProjectDTO,
    UpdateWorkshopProjectDTO
} from '../../../shared/types/index';
import { ISocketService } from '../../../shared/interfaces/ISocketService';

export interface IWorkshopProjectService {
    setSocketService(socketService: ISocketService): void;
    createProject(workshopId: string, actorId: string, data: CreateWorkshopProjectDTO): Promise<IWorkshopProject>;
    getProject(projectId: string): Promise<IWorkshopProject>;
    getWorkshopProjects(workshopId: string): Promise<IWorkshopProject[]>;
    getUserAccessibleProjects(workshopId: string, userId: string): Promise<IWorkshopProject[]>;
    updateProject(projectId: string, actorId: string, updates: UpdateWorkshopProjectDTO): Promise<IWorkshopProject>;
    deleteProject(projectId: string, actorId: string): Promise<void>;
    assignTeamToProject(projectId: string, actorId: string, teamId: string): Promise<IWorkshopProject>;
    removeTeamFromProject(projectId: string, actorId: string, teamId: string): Promise<IWorkshopProject>;
    assignIndividualToProject(projectId: string, actorId: string, userId: string): Promise<IWorkshopProject>;
    removeIndividualFromProject(projectId: string, actorId: string, userId: string): Promise<IWorkshopProject>;
    assignProjectManager(projectId: string, actorId: string, userId: string): Promise<IWorkshopProject>;
    addMaintainer(projectId: string, actorId: string, userId: string): Promise<IWorkshopProject>;
    removeMaintainer(projectId: string, actorId: string, userId: string): Promise<IWorkshopProject>;
    hasAccess(projectId: string, userId: string): Promise<boolean>;
}
