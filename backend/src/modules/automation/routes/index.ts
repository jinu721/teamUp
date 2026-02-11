import { Router } from 'express';
import { AutomationController } from '../controllers/AutomationController';
import { authenticate } from '../../../shared/middlewares/auth';
import { asyncHandler } from '../../../shared/middlewares/errorMiddleware';

export function setupAutomationRoutes(controller: AutomationController): Router {
    const router = Router();

    router.use(authenticate);

    router.post('/:workshopId/rules', asyncHandler((req, res) => controller.createRule(req, res)));
    router.get('/:workshopId/rules', asyncHandler((req, res) => controller.getRules(req, res)));
    router.put('/:workshopId/rules/:ruleId', asyncHandler((req, res) => controller.updateRule(req, res)));
    router.delete('/:workshopId/rules/:ruleId', asyncHandler((req, res) => controller.deleteRule(req, res)));
    router.patch('/:workshopId/rules/:ruleId/toggle', asyncHandler((req, res) => controller.toggleRule(req, res)));

    return router;
}
