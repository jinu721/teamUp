import { IWorkshopProject, CreateWorkshopProjectDTO, UpdateWorkshopProjectDTO } from '../types/index';

export interface IWorkshopProjectRepository {
    create(workshopId: string, projectData: CreateWorkshopProjectDTO): Promise<IWorkshopProject>;
    findById(id: string): Promise<IWorkshopProject | null>;
    findByWorkshop(workshopId: string): Promise<IWorkshopProject[]>;
    update(id: string, updates: UpdateWorkshopProjectDTO): Promise<IWorkshopProject>;
    delete(id: string): Promise<void>;
    deleteByWorkshop(workshopId: string): Promise<void>;
    assignTeam(projectId: string, teamId: string): Promise<IWorkshopProject>;
    removeTeam(projectId: string, teamId: string): Promise<IWorkshopProject>;
    assignIndividual(projectId: string, userId: string): Promise<IWorkshopProject>;
    removeIndividual(projectId: string, userId: string): Promise<IWorkshopProject>;
    assignProjectManager(projectId: string, userId: string): Promise<IWorkshopProject>;
    removeProjectManager(projectId: string): Promise<IWorkshopProject>;
    addMaintainer(projectId: string, userId: string): Promise<IWorkshopProject>;
    removeMaintainer(projectId: string, userId: string): Promise<IWorkshopProject>;
    isUserAssigned(projectId: string, userId: string): Promise<boolean>;
    addTeam(projectId: string, teamId: string): Promise<IWorkshopProject>;
    addIndividual(projectId: string, userId: string): Promise<IWorkshopProject>;
    findAccessibleByUser(workshopId: string, userId: string, teamIds: string[]): Promise<IWorkshopProject[]>;
    findAccessible(userId: string, workshopId: string, teamIds?: string[]): Promise<IWorkshopProject[]>;
    countByWorkshop(workshopId: string): Promise<number>;
}
