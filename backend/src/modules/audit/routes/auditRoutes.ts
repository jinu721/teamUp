import { Router } from 'express';
import { authenticate } from '../../../shared/middlewares/auth';
import { Container } from '../../../di/types';

export const createAuditRoutes = (container: Container) => {
    const router = Router({ mergeParams: true });
    const auditController = container.auditCtrl;

    router.use(authenticate);

    router.get('/', auditController.getAuditLogs);
    router.get('/recent', auditController.getRecentLogs);
    router.get('/stats', auditController.getAuditStats);
    router.get('/user/:targetUserId', auditController.getUserActivityLogs);
    router.get('/user/:targetUserId/summary', auditController.getUserActivitySummary);
    router.get('/target/:targetId', auditController.getTargetLogs);

    return router;
};

export default createAuditRoutes;