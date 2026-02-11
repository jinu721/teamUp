import { IAutomationRule, CreateAutomationRuleDTO } from '../types/index';

export interface IAutomationService {
    createRule(workshopId: string, userId: string, data: CreateAutomationRuleDTO): Promise<IAutomationRule>;
    getRules(workshopId: string): Promise<IAutomationRule[]>;
    updateRule(ruleId: string, userId: string, updates: Partial<CreateAutomationRuleDTO>): Promise<IAutomationRule>;
    deleteRule(ruleId: string, userId: string): Promise<void>;
    toggleRule(ruleId: string, userId: string, isActive: boolean): Promise<IAutomationRule>;

    // Execution core
    handleEvent(triggerType: string, context: any): Promise<void>;
}
