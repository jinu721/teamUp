import { IInvitation } from '../types/index';

export interface IInvitationRepository {
    findByToken(token: string): Promise<IInvitation | null>;
    findById(id: string): Promise<IInvitation | null>;
    markAsUsed(id: string): Promise<void>;
}
