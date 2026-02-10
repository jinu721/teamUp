import { Router } from 'express';
import { authMiddleware } from '@middlewares';
import { AUDIT_ROUTES } from '@constants';
import { Container } from '@di/types';

export const createAuditRoutes = (container: Container) => {
    const router = Router({ mergeParams: true });
    const auditController = container.auditCtrl;

    router.use(authMiddleware);

    router.get(AUDIT_ROUTES.BASE, auditController.getAuditLogs);
    router.get(AUDIT_ROUTES.RECENT, auditController.getRecentLogs);
    router.get(AUDIT_ROUTES.STATS, auditController.getAuditStats);
    router.get(AUDIT_ROUTES.USER_ACTIVITY, auditController.getUserActivityLogs);
    router.get(AUDIT_ROUTES.USER_SUMMARY, auditController.getUserActivitySummary);
    router.get(AUDIT_ROUTES.TARGET, auditController.getTargetLogs);

    return router;
};

export default createAuditRoutes;