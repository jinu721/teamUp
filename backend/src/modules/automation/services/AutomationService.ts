import { IAutomationService } from '../interfaces/IAutomationService';
import {
    IAutomationRule,
    CreateAutomationRuleDTO,
    AutomationTriggerType,
    AutomationActionType,
    IAutomationCondition
} from '../types/index';
import { AutomationRule } from '../models/AutomationRule';
import { eventBus } from '../../../shared/utils/EventBus';
import { IWorkshopTaskRepository } from '../../task/interfaces/IWorkshopTaskRepository';
import { INotificationRepository } from '../../notification/interfaces/INotificationRepository';
import { IAuditService } from '../../audit/interfaces/IAuditService';
import { AuditAction } from '../../audit/types/index';
import { NotificationType } from '../../notification/types/index';
import { NotFoundError } from '../../../shared/utils/errors';

export class AutomationService implements IAutomationService {
    constructor(
        private taskRepo: IWorkshopTaskRepository,
        private notificationRepo: INotificationRepository,
        private auditService: IAuditService
    ) {
        this.initEventListeners();
    }

    private initEventListeners() {
        eventBus.on('task:status:changed', (data) => this.handleEvent(AutomationTriggerType.TASK_STATUS_CHANGED, data));
        eventBus.on('task:priority:changed', (data) => this.handleEvent(AutomationTriggerType.TASK_PRIORITY_CHANGED, data));
        eventBus.on('task:created', (data) => this.handleEvent(AutomationTriggerType.TASK_CREATED, data));
        eventBus.on('member:joined', (data) => this.handleEvent(AutomationTriggerType.MEMBER_JOINED, data));
        eventBus.on('comment:added', (data) => this.handleEvent(AutomationTriggerType.COMMENT_ADDED, data));
    }

    async createRule(workshopId: string, userId: string, data: CreateAutomationRuleDTO): Promise<IAutomationRule> {
        const rule = await AutomationRule.create({
            ...data,
            workshopId,
            createdBy: userId
        });

        await this.auditService.log({
            workshopId,
            action: AuditAction.AUTOMATION_RULE_CREATED,
            actorId: userId,
            targetId: rule._id.toString(),
            targetType: 'AutomationRule',
            details: { name: rule.name }
        });

        return rule.toObject();
    }

    async getRules(workshopId: string): Promise<IAutomationRule[]> {
        return await AutomationRule.find({ workshopId }).lean();
    }

    async updateRule(ruleId: string, userId: string, updates: Partial<CreateAutomationRuleDTO>): Promise<IAutomationRule> {
        const rule = await AutomationRule.findById(ruleId);
        if (!rule) throw new NotFoundError('Automation Rule');

        Object.assign(rule, updates);
        await rule.save();

        await this.auditService.log({
            workshopId: rule.workshopId.toString(),
            action: AuditAction.AUTOMATION_RULE_UPDATED,
            actorId: userId,
            targetId: rule._id.toString(),
            targetType: 'AutomationRule',
            details: { name: rule.name }
        });

        return rule.toObject();
    }

    async deleteRule(ruleId: string, userId: string): Promise<void> {
        const rule = await AutomationRule.findById(ruleId);
        if (rule) {
            const workshopId = rule.workshopId.toString();
            const ruleName = rule.name;
            await AutomationRule.deleteOne({ _id: ruleId });

            await this.auditService.log({
                workshopId,
                action: AuditAction.AUTOMATION_RULE_DELETED,
                actorId: userId,
                targetId: ruleId,
                targetType: 'AutomationRule',
                details: { name: ruleName }
            });
        }
    }

    async toggleRule(ruleId: string, userId: string, isActive: boolean): Promise<IAutomationRule> {
        const rule = await AutomationRule.findByIdAndUpdate(ruleId, { isActive }, { new: true });
        if (!rule) throw new NotFoundError('Automation Rule');

        await this.auditService.log({
            workshopId: rule.workshopId.toString(),
            action: AuditAction.AUTOMATION_RULE_UPDATED,
            actorId: userId,
            targetId: rule._id.toString(),
            targetType: 'AutomationRule',
            details: { name: rule.name, isActive }
        });

        return rule.toObject();
    }

    async handleEvent(triggerType: AutomationTriggerType, context: any): Promise<void> {
        const { workshopId } = context;
        if (!workshopId) return;

        try {
            const activeRules = await AutomationRule.find({
                workshopId,
                'trigger.type': triggerType,
                isActive: true
            });

            for (const rule of activeRules) {
                if (this.evaluateConditions(rule.conditions, context)) {
                    await this.executeActions(rule.actions, context);

                    await this.auditService.log({
                        workshopId: workshopId.toString(),
                        action: AuditAction.AUTOMATION_RULE_TRIGGERED,
                        actorId: 'SYSTEM',
                        targetId: rule._id.toString(),
                        targetType: 'AutomationRule',
                        details: { ruleName: rule.name, triggerType }
                    });
                }
            }

        } catch (error) {
            console.error(`Error executing automation rule for ${triggerType}:`, error);
        }
    }

    private evaluateConditions(conditions: IAutomationCondition[], context: any): boolean {
        if (!conditions || conditions.length === 0) return true;

        return conditions.every(condition => {
            const actualValue = this.getValueFromPath(context, condition.field);

            switch (condition.operator) {
                case 'equals': return actualValue === condition.value;
                case 'not_equals': return actualValue !== condition.value;
                case 'contains':
                    if (Array.isArray(actualValue)) return actualValue.includes(condition.value);
                    return String(actualValue).includes(condition.value);
                case 'greater_than': return Number(actualValue) > Number(condition.value);
                case 'less_than': return Number(actualValue) < Number(condition.value);
                default: return false;
            }
        });
    }

    private getValueFromPath(obj: any, path: string): any {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    }

    private async executeActions(actions: any[], context: any): Promise<void> {
        for (const action of actions) {
            try {
                switch (action.type) {
                    case AutomationActionType.UPDATE_TASK_STATUS:
                        if (context.task?._id) {
                            await this.taskRepo.updateStatus(context.task._id.toString(), action.config.status, 'SYSTEM_AUTOMATION');
                        }
                        break;

                    case AutomationActionType.NOTIFY_USER:
                        const userId = action.config.userId === 'TASK_OWNER' ? context.task?.primaryOwner : action.config.userId;
                        if (userId) {
                            await this.notificationRepo.create({
                                user: userId,
                                type: NotificationType.TASK_UPDATED,
                                title: 'Automation Rule Triggered',
                                message: action.config.message || 'A custom automation rule was applied.',
                                relatedWorkshop: context.workshopId,
                                relatedTask: context.task?._id,
                                isRead: false
                            } as any);
                        }
                        break;

                    case AutomationActionType.ADD_TASK_COMMENT:
                        if (context.task?._id) {
                            await this.taskRepo.addComment(context.task._id.toString(), 'SYSTEM_AUTOMATION', action.config.content);
                        }
                        break;
                }
            } catch (err) {
                console.error(`Failed to execute action ${action.type}:`, err);
            }
        }
    }
}
