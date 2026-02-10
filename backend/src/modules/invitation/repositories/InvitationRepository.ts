import { Invitation } from '../models/Invitation';
import { IInvitation } from '../types/index';
import { IInvitationRepository } from '../interfaces/IInvitationRepository';

export class InvitationRepository implements IInvitationRepository {
    async findByToken(token: string): Promise<IInvitation | null> {
        return await Invitation.findOne({
            token,
            isUsed: false,
            expiresAt: { $gt: new Date() }
        })
            .populate('workshop', 'name description visibility')
            .populate('invitedBy', 'name email');
    }

    async findById(id: string): Promise<IInvitation | null> {
        return await Invitation.findById(id);
    }

    async markAsUsed(id: string): Promise<void> {
        await Invitation.findByIdAndUpdate(id, { isUsed: true });
    }
}
