import { Router } from 'express';
import { PermissionController } from '../controllers/PermissionController';
import { authenticate } from '../middlewares/auth';
import { requireWorkshopMembership } from '../middlewares/permission';
import { PermissionService } from '../services/PermissionService';

const router = Router({ mergeParams: true });
const permissionService = PermissionService.getInstance();
const permissionController = new PermissionController(permissionService);

router.use(authenticate);
router.use(requireWorkshopMembership);

router.post('/check', permissionController.checkPermission);

export default router;
export { permissionService, permissionController };