import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { Invitation } from '../models/Invitation';
import { WorkshopService } from '../services/WorkshopService';
import { NotFoundError, ValidationError } from '../utils/errors';

export class InviteController {
    private workshopService: WorkshopService;

    constructor() {
        this.workshopService = new WorkshopService();
    }

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

            // Ensure the logged-in user's email matches the invite email (optional but recommended)
            const User = require('../models/User').User;
            const user = await User.findById(userId);
            if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
                throw new ValidationError(`This invitation was sent to ${invitation.email}, but you are logged in as ${user.email}`);
            }

            // Add user to workshop
            await this.workshopService.acceptInvitationByToken(invitation, userId);

            // Mark invite as used
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
