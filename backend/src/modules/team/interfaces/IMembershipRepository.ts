import { IMembership, MembershipState, CreateMembershipDTO } from '../types/index';

export interface IMembershipRepository {
    create(membershipData: CreateMembershipDTO): Promise<IMembership>;
    findById(id: string): Promise<IMembership | null>;
    findByIdRaw(id: string): Promise<IMembership | null>;
    findByWorkshop(workshopId: string, state?: MembershipState): Promise<IMembership[]>;
    findByUser(userId: string, state?: MembershipState): Promise<IMembership[]>;
    findByWorkshopAndUser(workshopId: string, userId: string): Promise<IMembership | null>;
    findActive(workshopId: string, userId: string): Promise<IMembership | null>;
    findPendingByWorkshop(workshopId: string): Promise<IMembership[]>;
    updateState(membershipId: string, newState: MembershipState, actorId?: string): Promise<IMembership>;
    isActiveMember(workshopId: string, userId: string): Promise<boolean>;
    countByWorkshop(workshopId: string, state?: MembershipState): Promise<number>;
    countByUser(userId: string, state?: MembershipState): Promise<number>;
    deleteByWorkshop(workshopId: string): Promise<void>;
    deleteByUser(workshopId: string, userId: string): Promise<void>;
    getActiveMembers(workshopId: string): Promise<IMembership[]>;
    getPendingInvitations(workshopId: string): Promise<IMembership[]>;
    getPendingJoinRequests(workshopId: string): Promise<IMembership[]>;
    delete(membershipId: string): Promise<void>;
}
