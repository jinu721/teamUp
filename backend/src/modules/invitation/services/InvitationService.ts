import { InvitationRepository } from '../repositories/InvitationRepository';
import { WorkshopService } from '../../workshop/services/WorkshopService';
import { UserRepository } from '../../user/repositories/UserRepository';
import { NotFoundError, ValidationError } from '../../../shared/utils/errors';

export class InvitationService {
    constructor(
        private invitationRepo: InvitationRepository,
        private workshopService: WorkshopService,
        private userRepository: UserRepository
    ) { }

    async getInviteDetails(token: string): Promise<any> {
        const invitation = await this.invitationRepo.findByToken(token);
        if (!invitation) {
            throw new NotFoundError('Invitation is invalid or has expired');
        }

        return {
            type: 'workshop',
            project: {
                _id: (invitation.workshop as any)._id,
                title: (invitation.workshop as any).name,
                description: (invitation.workshop as any).description,
            },
            invitedBy: invitation.invitedBy,
            email: invitation.email,
            expiresAt: invitation.expiresAt
        };
    }

    async acceptInvite(token: string, userId: string): Promise<void> {
        const invitation = await this.invitationRepo.findByToken(token);
        if (!invitation) {
            throw new NotFoundError('Invitation is invalid or has expired');
        }

        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
            throw new ValidationError(`This invitation was sent to ${invitation.email}, but you are logged in as ${user.email}`);
        }

        await this.workshopService.acceptInvitationByToken(invitation, userId);
        await this.invitationRepo.markAsUsed(invitation._id.toString());
    }
}
