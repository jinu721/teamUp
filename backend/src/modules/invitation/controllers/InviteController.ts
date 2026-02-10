import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../shared/types/index';
import { InvitationService } from '../services/InvitationService';
import { ValidationError } from '../../../shared/utils/errors';
export class InviteController {
    constructor(
        private invitationService: InvitationService
    ) { }

    getInviteDetails = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { token } = req.params;
            const details = await this.invitationService.getInviteDetails(token);

            res.json({
                success: true,
                data: details
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

            await this.invitationService.acceptInvite(token, userId);

            res.json({
                success: true,
                message: 'You have successfully joined the workshop'
            });
        } catch (error) {
            next(error);
        }
    };
}
