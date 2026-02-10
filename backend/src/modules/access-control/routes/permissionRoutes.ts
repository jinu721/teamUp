import { Router } from 'express';
import { authMiddleware, requireWorkshopMembership } from '@middlewares';
import { PERMISSION_ROUTES } from '@constants';
import { Container } from '@di/types';

export const createPermissionRoutes = (container: Container) => {
    const router = Router({ mergeParams: true });
    const permissionController = container.permissionCtrl;

    router.use(authMiddleware);
    router.use(requireWorkshopMembership);

    router.post(PERMISSION_ROUTES.CHECK, permissionController.checkPermission);

    return router;
};

export default createPermissionRoutes;