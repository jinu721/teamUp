import { Router } from 'express';
import { authMiddleware } from '@middlewares';
import { ROLE_ROUTES } from '@constants';
import { Container } from '@di/types';

export const createRoleRoutes = (container: Container) => {
    const router = Router({ mergeParams: true });
    const roleController = container.roleCtrl;

    router.use(authMiddleware);

    router.post(ROLE_ROUTES.BASE, roleController.createRole);
    router.get(ROLE_ROUTES.BASE, roleController.getRoles);
    router.get(ROLE_ROUTES.BY_ID, roleController.getRole);
    router.put(ROLE_ROUTES.BY_ID, roleController.updateRole);
    router.delete(ROLE_ROUTES.BY_ID, roleController.deleteRole);
    router.post(ROLE_ROUTES.ASSIGN, roleController.assignRole);
    router.delete(ROLE_ROUTES.REVOKE, roleController.revokeRole);
    router.get(ROLE_ROUTES.USER_ROLES, roleController.getUserRoles);

    return router;
};

export default createRoleRoutes;