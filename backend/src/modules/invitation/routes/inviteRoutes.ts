import { Router } from 'express';
import { authMiddleware } from '@middlewares';
import { INVITE_ROUTES } from '@constants';
import { Container } from '@di/types';

export const createInviteRoutes = (container: Container) => {
    const router = Router();
    const inviteController = container.inviteCtrl;

    router.get(INVITE_ROUTES.BY_TOKEN, inviteController.getInviteDetails as any);
    router.post(INVITE_ROUTES.ACCEPT, authMiddleware as any, inviteController.acceptInvite as any);

    return router;
};

export default createInviteRoutes;
