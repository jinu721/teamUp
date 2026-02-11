import { Request, Response } from 'express';
import { IAutomationService } from '../interfaces/IAutomationService';
import { IWorkshopRepository } from '../../workshop/interfaces/IWorkshopRepository';
import { AuthorizationError } from '../../../shared/utils/errors';

export class AutomationController {
    constructor(
        private automationService: IAutomationService,
        private workshopRepo: IWorkshopRepository
    ) { }

    async createRule(req: Request, res: Response) {
        const { workshopId } = req.params;
        const userId = (req as any).user.id;

        if (!(await this.workshopRepo.isOwnerOrManager(workshopId, userId))) {
            throw new AuthorizationError('Only workshop admins can manage automation rules');
        }

        const rule = await this.automationService.createRule(workshopId, userId, req.body);
        return res.status(201).json(rule);
    }

    async getRules(req: Request, res: Response) {
        const { workshopId } = req.params;

        // Any member can likely view rules, but you might want to restrict this

        const rules = await this.automationService.getRules(workshopId);
        return res.json(rules);
    }

    async updateRule(req: Request, res: Response) {
        const { workshopId, ruleId } = req.params;
        const userId = (req as any).user.id;

        if (!(await this.workshopRepo.isOwnerOrManager(workshopId, userId))) {
            throw new AuthorizationError('Only workshop admins can manage automation rules');
        }

        const rule = await this.automationService.updateRule(ruleId, userId, req.body);
        return res.json(rule);
    }

    async deleteRule(req: Request, res: Response) {
        const { workshopId, ruleId } = req.params;
        const userId = (req as any).user.id;

        if (!(await this.workshopRepo.isOwnerOrManager(workshopId, userId))) {
            throw new AuthorizationError('Only workshop admins can manage automation rules');
        }

        await this.automationService.deleteRule(ruleId, userId);
        return res.status(204).send();
    }

    async toggleRule(req: Request, res: Response) {
        const { workshopId, ruleId } = req.params;
        const userId = (req as any).user.id;
        const { isActive } = req.body;

        if (!(await this.workshopRepo.isOwnerOrManager(workshopId, userId))) {
            throw new AuthorizationError('Only workshop admins can manage automation rules');
        }

        const rule = await this.automationService.toggleRule(ruleId, userId, isActive);
        return res.json(rule);
    }
}
