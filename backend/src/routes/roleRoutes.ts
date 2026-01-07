import { Router } from 'express';
import { RoleController } from '../controllers/RoleController';
import { authenticate } from '../middlewares/auth';

const router = Router({ mergeParams: true }); // Enable access to parent route params
const roleController = new RoleController();

// All routes require authentication
router.use(authenticate);

// Role CRUD
router.post('/', roleController.createRole);
router.get('/', roleController.getRoles);
router.get('/:id', roleController.getRole);
router.put('/:id', roleController.updateRole);
router.delete('/:id', roleController.deleteRole);

// Role assignment
router.post('/:id/assign', roleController.assignRole);
router.delete('/:id/assign/:userId', roleController.revokeRole);

// User roles query
router.get('/user/:userId', roleController.getUserRoles);

export default router;
export { roleController };
