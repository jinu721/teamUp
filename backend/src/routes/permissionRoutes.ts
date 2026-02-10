import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { requireWorkshopMembership } from '../middlewares/permission';
import { Container } from '../di/types';

export const createPermissionRoutes = (container: Container) => {
    const router = Router({ mergeParams: true });
    const permissionController = container.permissionCtrl;

    router.use(authenticate);
    router.use(requireWorkshopMembership);

    router.post('/check', permissionController.checkPermission);

    return router;
};

export default createPermissionRoutes;