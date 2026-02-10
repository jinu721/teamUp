import { IInvitation } from '../models/Invitation';

export interface IInvitationRepository {
    findByToken(token: string): Promise<IInvitation | null>;
    findById(id: string): Promise<IInvitation | null>;
    markAsUsed(id: string): Promise<void>;
}
