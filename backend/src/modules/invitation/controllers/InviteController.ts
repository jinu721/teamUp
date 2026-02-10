import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../shared/types/index';
import { Invitation } from '../models/Invitation';
import { WorkshopService } from '../../workshop/services/WorkshopService';
import { NotFoundError, ValidationError } from '../../../shared/utils/errors';
import { UserRepository } from '../../user/repositories/UserRepository';

export class InviteController {
    constructor(
        private workshopService: WorkshopService,
        private userRepository: UserRepository
    ) { }

    getInviteDetails = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { token } = req.params;
            const invitation = await Invitation.findOne({ token, isUsed: false, expiresAt: { $gt: new Date() } })
                .populate('workshop', 'name description visibility')
                .populate('invitedBy', 'name email');

            if (!invitation) {
                throw new NotFoundError('Invitation is invalid or has expired');
            }

            res.json({
                success: true,
                data: {
                    type: 'workshop',
                    project: {
                        _id: (invitation.workshop as any)._id,
                        title: (invitation.workshop as any).name,
                        description: (invitation.workshop as any).description,
                    },
                    invitedBy: invitation.invitedBy,
                    email: invitation.email,
                    expiresAt: invitation.expiresAt
                }
            });
        } catch (error) {
            next(error);
        }
    };

    acceptInvite = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { token } = req.params;
            const userId = req.user?.id;

            if (!userId) {
                throw new ValidationError('Authentication required to accept invitation');
            }

            const invitation = await Invitation.findOne({ token, isUsed: false, expiresAt: { $gt: new Date() } });
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

            invitation.isUsed = true;
            await invitation.save();

            res.json({
                success: true,
                message: 'You have successfully joined the workshop'
            });
        } catch (error) {
            next(error);
        }
    };
}
