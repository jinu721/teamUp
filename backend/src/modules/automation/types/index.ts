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
    ADD_TASK_COMMENT = 'ADD_TASK_COMMENT',
    RESTRICT_TRANSITION = 'RESTRICT_TRANSITION'
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
    _id: any;
    workshopId: any;
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
    createdAt: Date;
    updatedAt: Date;
}


export interface CreateAutomationRuleDTO {
    name: string;
    description?: string;
    trigger: {
        type: AutomationTriggerType;
        config?: Record<string, any>;
    };
    conditions: IAutomationCondition[];
    actions: IAutomationAction[];
}
