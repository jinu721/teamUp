import { IWorkshop, CreateWorkshopDTO, UpdateWorkshopDTO } from '../types/index';
import { IMembership, MembershipState } from '../../team/types/index';
import { IInvitation } from '../../invitation/types/index';
import { ISocketService } from '../../../shared/interfaces/ISocketService';

export interface IWorkshopService {
    setSocketService(socketService: ISocketService): void;
    createWorkshop(ownerId: string, data: CreateWorkshopDTO): Promise<IWorkshop>;
    getWorkshop(workshopId: string): Promise<IWorkshop>;
    getUserWorkshops(userId: string): Promise<IWorkshop[]>;
    updateWorkshop(workshopId: string, actorId: string, updates: UpdateWorkshopDTO): Promise<IWorkshop>;
    deleteWorkshop(workshopId: string, actorId: string): Promise<void>;
    assignManager(workshopId: string, actorId: string, managerId: string): Promise<IWorkshop>;
    removeManager(workshopId: string, actorId: string, managerId: string): Promise<IWorkshop>;
    inviteMember(workshopId: string, actorId: string, invitedEmail: string, roleId?: string): Promise<void>;
    acceptInvitationByToken(invitation: IInvitation, userId: string): Promise<IMembership>;
    handleJoinRequest(workshopId: string, userId: string): Promise<IMembership>;
    approveJoinRequest(workshopId: string, actorId: string, membershipId: string): Promise<IMembership>;
    rejectJoinRequest(workshopId: string, actorId: string, membershipId: string, reason?: string): Promise<IMembership>;
    revokeMembership(workshopId: string, actorId: string, userId: string, reason?: string): Promise<IMembership>;
    handleMemberLeave(workshopId: string, userId: string): Promise<void>;
    getMembers(workshopId: string, state?: MembershipState): Promise<any[]>;
    getPendingRequests(workshopId: string): Promise<IMembership[]>;
    getPublicWorkshops(options?: any, currentUserId?: string): Promise<{ workshops: any[]; total: number; pages: number }>;
    upvoteWorkshop(userId: string, workshopId: string): Promise<IWorkshop>;
    downvoteWorkshop(userId: string, workshopId: string): Promise<IWorkshop>;
    isMember(workshopId: string, userId: string): Promise<boolean>;
    checkPermission(userId: string, workshopId: string, action: string, resource: string, context?: any): Promise<any>;
}
