import { Router } from 'express';
import { AuditController } from '../controllers/AuditController';
import { authenticate } from '../middlewares/auth';

const router = Router({ mergeParams: true });
const auditController = new AuditController();

router.use(authenticate);

router.get('/', auditController.getAuditLogs);
router.get('/recent', auditController.getRecentLogs);
router.get('/stats', auditController.getAuditStats);
router.get('/user/:targetUserId', auditController.getUserActivityLogs);
router.get('/user/:targetUserId/summary', auditController.getUserActivitySummary);
router.get('/target/:targetId', auditController.getTargetLogs);

export default router;
export { auditController };