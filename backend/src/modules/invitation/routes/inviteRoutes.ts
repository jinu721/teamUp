import { Router } from 'express';
import { authenticate } from '../../../shared/middlewares/auth';
import { Container } from '../../../di/types';

export const createInviteRoutes = (container: Container) => {
    const router = Router();
    const inviteController = container.inviteCtrl;

    router.get('/:token', inviteController.getInviteDetails as any);
    router.post('/:token/accept', authenticate as any, inviteController.acceptInvite as any);

    return router;
};

export default createInviteRoutes;
