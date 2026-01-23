import { Router } from 'express';
import { RoleController } from '../controllers/RoleController';
import { authenticate } from '../middlewares/auth';

const router = Router({ mergeParams: true });
const roleController = new RoleController();

router.use(authenticate);

router.post('/', roleController.createRole);
router.get('/', roleController.getRoles);
router.get('/:id', roleController.getRole);
router.put('/:id', roleController.updateRole);
router.delete('/:id', roleController.deleteRole);

router.post('/:id/assign', roleController.assignRole);
router.delete('/:id/assign/:userId', roleController.revokeRole);

router.get('/user/:userId', roleController.getUserRoles);

export default router;
export { roleController };