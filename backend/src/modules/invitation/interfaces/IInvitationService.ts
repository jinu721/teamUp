export interface IInvitationService {
    getInviteDetails(token: string): Promise<any>;
    acceptInvite(token: string, userId: string): Promise<void>;
}
