import api from './api';

export enum AutomationTriggerType {
    TASK_STATUS_CHANGED = 'TASK_STATUS_CHANGED',
    TASK_PRIORITY_CHANGED = 'TASK_PRIORITY_CHANGED',
    TASK_CREATED = 'TASK_CREATED',
    MEMBER_JOINED = 'MEMBER_JOINED',
    COMMENT_ADDED = 'COMMENT_ADDED'
}

export enum AutomationActionType {
    UPDATE_TASK_STATUS = 'UPDATE_TASK_STATUS',
    ASSIGN_USER = 'ASSIGN_USER',
    NOTIFY_USER = 'NOTIFY_USER',
    ADD_TASK_COMMENT = 'ADD_TASK_COMMENT'
}

export interface IAutomationCondition {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
}

export interface IAutomationAction {
    type: AutomationActionType;
    config: Record<string, any>;
}

export interface IAutomationRule {
    _id: string;
    workshopId: string;
    name: string;
    description?: string;
    trigger: {
        type: AutomationTriggerType;
        config?: Record<string, any>;
    };
    conditions: IAutomationCondition[];
    actions: IAutomationAction[];
    isActive: boolean;
    createdBy: any;
    createdAt: string;
    updatedAt: string;
}

export const automationApi = {
    getRules: async (workshopId: string): Promise<IAutomationRule[]> => {
        const response = await api.api.get(`/workshops/${workshopId}/automation/rules`);
        return response.data;
    },

    createRule: async (workshopId: string, data: any): Promise<IAutomationRule> => {
        const response = await api.api.post(`/workshops/${workshopId}/automation/rules`, data);
        return response.data;
    },

    updateRule: async (workshopId: string, ruleId: string, data: any): Promise<IAutomationRule> => {
        const response = await api.api.put(`/workshops/${workshopId}/automation/rules/${ruleId}`, data);
        return response.data;
    },

    deleteRule: async (workshopId: string, ruleId: string): Promise<void> => {
        await api.api.delete(`/workshops/${workshopId}/automation/rules/${ruleId}`);
    },

    toggleRule: async (workshopId: string, ruleId: string, isActive: boolean): Promise<IAutomationRule> => {
        const response = await api.api.patch(`/workshops/${workshopId}/automation/rules/${ruleId}/toggle`, { isActive });
        return response.data;
    }
};
