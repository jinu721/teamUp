import { Router } from 'express';
import { PermissionController } from '../controllers/PermissionController';
import { authenticate } from '../middlewares/auth';
import { requireWorkshopMembership } from '../middlewares/permission';
import { PermissionService } from '../services/PermissionService';

const router = Router({ mergeParams: true }); // Enable access to parent route params
const permissionService = PermissionService.getInstance();
const permissionController = new PermissionController(permissionService);

// All routes require authentication and workshop membership
router.use(authenticate);
router.use(requireWorkshopMembership);

// Permission checking
router.post('/check', permissionController.checkPermission);

export default router;
export { permissionService, permissionController };