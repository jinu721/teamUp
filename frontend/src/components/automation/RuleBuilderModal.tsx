import React, { useState, useEffect } from 'react';
import {
    X,
    Zap,
    Plus,
    Trash2,
    Save,
    AlertCircle,
    Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    automationApi,
    AutomationTriggerType,
    AutomationActionType,
    IAutomationRule
} from '../../services/automationApi';

interface RuleBuilderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    workshopId: string;
    editingRule?: IAutomationRule;
}

const RuleBuilderModal: React.FC<RuleBuilderModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    workshopId,
    editingRule
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [triggerType, setTriggerType] = useState<AutomationTriggerType>(AutomationTriggerType.TASK_STATUS_CHANGED);
    const [conditions, setConditions] = useState<any[]>([]);
    const [actions, setActions] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (editingRule) {
            setName(editingRule.name);
            setDescription(editingRule.description || '');
            setTriggerType(editingRule.trigger.type);
            setConditions(editingRule.conditions);
            setActions(editingRule.actions);
        } else {
            setName('');
            setDescription('');
            setTriggerType(AutomationTriggerType.TASK_STATUS_CHANGED);
            setConditions([]);
            setActions([{ type: AutomationActionType.NOTIFY_USER, config: {} }]);
        }
    }, [editingRule]);

    const handleAddCondition = () => {
        setConditions([...conditions, { field: 'task.status', operator: 'equals', value: '' }]);
    };

    const handleRemoveCondition = (index: number) => {
        setConditions(conditions.filter((_, i) => i !== index));
    };

    const handleAddAction = () => {
        setActions([...actions, { type: AutomationActionType.NOTIFY_USER, config: {} }]);
    };

    const handleRemoveAction = (index: number) => {
        setActions(actions.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!name || actions.length === 0) return;

        setIsSaving(true);
        try {
            const data = {
                name,
                description,
                trigger: { type: triggerType },
                conditions,
                actions,
                isActive: true
            };

            if (editingRule) {
                await automationApi.updateRule(workshopId, editingRule._id, data);
            } else {
                await automationApi.createRule(workshopId, data);
            }
            onSubmit();
            onClose();
        } catch (error) {
            console.error('Failed to save rule:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-[#0a0a0a] border border-gray-800 rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-3xl shadow-purple-500/10"
            >
                <header className="p-6 border-b border-gray-800 flex justify-between items-center bg-black/40">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-400">
                            <Zap size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{editingRule ? 'Edit Automation Rule' : 'New Workflow Rule'}</h2>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Automation Engine v1.0</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-400 transition-colors">
                        <X size={24} />
                    </button>
                </header>

                <div className="p-8 overflow-y-auto flex-1 custom-scrollbar space-y-10 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                    {/* Metadata Section */}
                    <section className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">Rule Identifier</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Auto-Assign Documentation Task"
                                    className="w-full bg-black/50 border border-gray-800 rounded-2xl p-4 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all placeholder:text-gray-700"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">Logical Intent</label>
                                <input
                                    type="text"
                                    placeholder="Briefly describe what this rule achieves..."
                                    className="w-full bg-black/50 border border-gray-800 rounded-2xl p-4 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all placeholder:text-gray-700"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Trigger Section */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold border border-blue-500/20">1</div>
                            <h3 className="text font-bold text-gray-300">Listen for Event</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Object.values(AutomationTriggerType).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setTriggerType(type)}
                                    className={`p-4 rounded-2xl border transition-all text-left group flex items-center gap-3 ${triggerType === type ? 'bg-blue-500/10 border-blue-500 text-blue-400' : 'bg-gray-900/30 border-gray-800 text-gray-500 hover:border-gray-700'}`}
                                >
                                    <div className={`p-2 rounded-lg transition-colors ${triggerType === type ? 'bg-blue-500 text-white' : 'bg-gray-800 group-hover:bg-gray-700'}`}>
                                        <Activity size={16} />
                                    </div>
                                    <span className="text-sm font-semibold capitalize">{type.toLowerCase().replace(/_/g, ' ')}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Conditions Section */}
                    <section className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 font-bold border border-orange-500/20">2</div>
                                <h3 className="text font-bold text-gray-300">Set Conditional Filters <span className="text-gray-500 text-sm font-normal ml-2">(Optional)</span></h3>
                            </div>
                            <button onClick={handleAddCondition} className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 bg-orange-400/5 px-3 py-1.5 rounded-lg border border-orange-400/10">
                                <Plus size={14} /> Add Filter
                            </button>
                        </div>

                        <AnimatePresence>
                            {conditions.map((condition, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="flex flex-wrap items-center gap-3 bg-black/40 border border-gray-800 p-4 rounded-[1.5rem]"
                                >
                                    <select
                                        className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500/50"
                                        value={condition.field}
                                        onChange={(e) => {
                                            const newConditions = [...conditions];
                                            newConditions[index].field = e.target.value;
                                            setConditions(newConditions);
                                        }}
                                    >
                                        <option value="task.status">Task Status</option>
                                        <option value="task.priority">Task Priority</option>
                                        <option value="task.title">Task Title</option>
                                        <option value="user.name">Actor Name</option>
                                    </select>

                                    <select
                                        className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500/50"
                                        value={condition.operator}
                                        onChange={(e) => {
                                            const newConditions = [...conditions];
                                            newConditions[index].operator = e.target.value;
                                            setConditions(newConditions);
                                        }}
                                    >
                                        <option value="equals">is exactly</option>
                                        <option value="not_equals">is not</option>
                                        <option value="contains">contains</option>
                                        <option value="greater_than">greater than</option>
                                        <option value="less_than">less than</option>
                                    </select>

                                    <input
                                        type="text"
                                        placeholder="Value..."
                                        className="flex-1 min-w-[120px] bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500/50"
                                        value={condition.value}
                                        onChange={(e) => {
                                            const newConditions = [...conditions];
                                            newConditions[index].value = e.target.value;
                                            setConditions(newConditions);
                                        }}
                                    />

                                    <button onClick={() => handleRemoveCondition(index)} className="p-2 text-gray-500 hover:text-red-400 transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {conditions.length === 0 && (
                            <div className="py-6 border-2 border-dashed border-gray-800 rounded-2xl flex items-center justify-center text-gray-600 text-sm italic">
                                No filters set. This rule will trigger on every event.
                            </div>
                        )}
                    </section>

                    {/* Actions Section */}
                    <section className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold border border-purple-500/20">3</div>
                                <h3 className="text font-bold text-gray-300">Execute Automated Actions</h3>
                            </div>
                            <button onClick={handleAddAction} className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 bg-purple-400/5 px-3 py-1.5 rounded-lg border border-purple-400/10">
                                <Plus size={14} /> Add Action
                            </button>
                        </div>

                        {actions.map((action, index) => (
                            <div key={index} className="space-y-4 bg-purple-900/5 border border-purple-500/10 p-6 rounded-[1.5rem]">
                                <div className="flex justify-between items-start">
                                    <select
                                        className="bg-[#111] border border-gray-800 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-500/50"
                                        value={action.type}
                                        onChange={(e) => {
                                            const newActions = [...actions];
                                            newActions[index].type = e.target.value;
                                            setActions(newActions);
                                        }}
                                    >
                                        <option value={AutomationActionType.NOTIFY_USER}>Notify User/Owner</option>
                                        <option value={AutomationActionType.UPDATE_TASK_STATUS}>Update Task Status</option>
                                        <option value={AutomationActionType.ADD_TASK_COMMENT}>Append Task Comment</option>
                                    </select>
                                    <button onClick={() => handleRemoveAction(index)} className="p-2 text-gray-600 hover:text-red-400 transition-colors">
                                        <Trash2 size={20} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {action.type === AutomationActionType.UPDATE_TASK_STATUS && (
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-600 uppercase ml-1">New Status</label>
                                            <select
                                                className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-sm outline-none"
                                                value={action.config.status || ''}
                                                onChange={(e) => {
                                                    const newActions = [...actions];
                                                    newActions[index].config = { ...newActions[index].config, status: e.target.value };
                                                    setActions(newActions);
                                                }}
                                            >
                                                <option value="">Select Status...</option>
                                                <option value="BACKLOG">Backlog</option>
                                                <option value="TODO">To Do</option>
                                                <option value="IN_PROGRESS">In Progress</option>
                                                <option value="REVIEW">Review</option>
                                                <option value="DONE">Done</option>
                                            </select>
                                        </div>
                                    )}

                                    {action.type === AutomationActionType.NOTIFY_USER && (
                                        <>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-gray-600 uppercase ml-1">Recipient</label>
                                                <select
                                                    className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-sm outline-none font-medium"
                                                    value={action.config.userId || ''}
                                                    onChange={(e) => {
                                                        const newActions = [...actions];
                                                        newActions[index].config = { ...newActions[index].config, userId: e.target.value };
                                                        setActions(newActions);
                                                    }}
                                                >
                                                    <option value="">Select Recipient...</option>
                                                    <option value="TASK_OWNER">Current Task Owner</option>
                                                    <option value="WORKSHOP_ADMINS">All Workshop Admins</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-gray-600 uppercase ml-1">Push Alert Message</label>
                                                <input
                                                    type="text"
                                                    placeholder="System notification content..."
                                                    className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-sm outline-none"
                                                    value={action.config.message || ''}
                                                    onChange={(e) => {
                                                        const newActions = [...actions];
                                                        newActions[index].config = { ...newActions[index].config, message: e.target.value };
                                                        setActions(newActions);
                                                    }}
                                                />
                                            </div>
                                        </>
                                    )}

                                    {action.type === AutomationActionType.ADD_TASK_COMMENT && (
                                        <div className="col-span-full space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-600 uppercase ml-1">Automated Comment</label>
                                            <textarea
                                                placeholder="This comment will be added automatically..."
                                                className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-sm outline-none min-h-[80px]"
                                                value={action.config.content || ''}
                                                onChange={(e) => {
                                                    const newActions = [...actions];
                                                    newActions[index].config = { ...newActions[index].config, content: e.target.value };
                                                    setActions(newActions);
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </section>
                </div>

                <footer className="p-6 border-t border-gray-800 bg-black/60 flex justify-between items-center gap-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                        <AlertCircle size={16} />
                        Rules take effect immediately upon deployment.
                    </div>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 rounded-2xl font-bold text-gray-400 hover:bg-white/5 transition-colors"
                            disabled={isSaving}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !name || actions.length === 0}
                            className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-bold shadow-xl transition-all ${isSaving || !name || actions.length === 0 ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:scale-[1.02] shadow-purple-500/20 hover:shadow-purple-500/40'}`}
                        >
                            {isSaving ? 'Processing...' : (
                                <><Save size={18} /> {editingRule ? 'Deploy Updates' : 'Deploy Rule'}</>
                            )}
                        </button>
                    </div>
                </footer>
            </motion.div>
        </div>
    );
};

export default RuleBuilderModal;
