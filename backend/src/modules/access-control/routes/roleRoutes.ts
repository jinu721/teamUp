import { Router } from 'express';
import { authenticate } from '../../../shared/middlewares/auth';
import { Container } from '../../../di/types';

export const createRoleRoutes = (container: Container) => {
    const router = Router({ mergeParams: true });
    const roleController = container.roleCtrl;

    router.use(authenticate);

    router.post('/', roleController.createRole);
    router.get('/', roleController.getRoles);
    router.get('/:id', roleController.getRole);
    router.put('/:id', roleController.updateRole);
    router.delete('/:id', roleController.deleteRole);
    router.post('/:id/assign', roleController.assignRole);
    router.delete('/:id/assign/:userId', roleController.revokeRole);
    router.get('/user/:userId', roleController.getUserRoles);

    return router;
};

export default createRoleRoutes;