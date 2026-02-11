import mongoose, { Schema, Document } from 'mongoose';
import { IAutomationRule, AutomationTriggerType, AutomationActionType } from '../types/index';

const automationRuleSchema = new Schema<IAutomationRule & Document>(
    {
        workshopId: {
            type: Schema.Types.ObjectId,
            ref: 'Workshop',
            required: true,
            index: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        trigger: {
            type: {
                type: String,
                enum: Object.values(AutomationTriggerType),
                required: true
            },
            config: {
                type: Map,
                of: Schema.Types.Mixed
            }
        },
        conditions: [
            {
                field: { type: String, required: true },
                operator: {
                    type: String,
                    enum: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than'],
                    required: true
                },
                value: { type: Schema.Types.Mixed, required: true }
            }
        ],
        actions: [
            {
                type: {
                    type: String,
                    enum: Object.values(AutomationActionType),
                    required: true
                },
                config: {
                    type: Map,
                    of: Schema.Types.Mixed
                }
            }
        ],
        isActive: {
            type: Boolean,
            default: true
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    {
        timestamps: true
    }
);

automationRuleSchema.index({ workshopId: 1, isActive: 1 });

export const AutomationRule = mongoose.model<IAutomationRule & Document>('AutomationRule', automationRuleSchema);
