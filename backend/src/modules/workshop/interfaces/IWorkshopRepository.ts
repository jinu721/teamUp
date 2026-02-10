import { IWorkshop, CreateWorkshopDTO, UpdateWorkshopDTO } from '../types/index';

export interface IWorkshopRepository {
    create(ownerId: string, workshopData: CreateWorkshopDTO): Promise<IWorkshop>;
    findById(id: string): Promise<IWorkshop | null>;
    findByUser(userId: string): Promise<IWorkshop[]>;
    findPublic(options?: any): Promise<IWorkshop[]>;
    countPublic(options?: any): Promise<number>;
    update(id: string, updates: UpdateWorkshopDTO): Promise<IWorkshop>;
    delete(id: string): Promise<void>;
    addManager(workshopId: string, managerId: string): Promise<IWorkshop>;
    removeManager(workshopId: string, managerId: string): Promise<IWorkshop>;
    isOwner(workshopId: string, userId: string): Promise<boolean>;
    isManager(workshopId: string, userId: string): Promise<boolean>;
    isOwnerOrManager(workshopId: string, userId: string): Promise<boolean>;
    getManagerCount(workshopId: string): Promise<number>;
    searchPublic(searchTerm: string, limit?: number): Promise<IWorkshop[]>;
    incrementVote(workshopId: string, amount: number, isUpvote: boolean): Promise<IWorkshop>;
    updateVoteStats(workshopId: string, upvotes: number, downvotes: number): Promise<IWorkshop>;
}
