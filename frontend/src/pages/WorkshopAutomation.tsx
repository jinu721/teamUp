import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    automationApi,
    IAutomationRule
} from '../services/automationApi';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Zap,
    Settings2,
    Trash2,
    CheckCircle2,
    XCircle,
    Play,
    Pause,
    ChevronRight,
    Activity
} from 'lucide-react';
import RuleBuilderModal from '../components/automation/RuleBuilderModal';

const WorkshopAutomation: React.FC = () => {
    const { workshopId } = useParams<{ workshopId: string }>();
    const [rules, setRules] = useState<IAutomationRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<IAutomationRule | undefined>();

    useEffect(() => {
        fetchRules();
    }, [workshopId]);

    const fetchRules = async () => {
        if (!workshopId) return;
        try {
            setLoading(true);
            const data = await automationApi.getRules(workshopId);
            setRules(data);
        } catch (error) {
            console.error('Failed to fetch rules:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleRule = async (ruleId: string, isActive: boolean) => {
        if (!workshopId) return;
        try {
            const updatedRule = await automationApi.toggleRule(workshopId, ruleId, !isActive);
            setRules(rules.map(r => r._id === ruleId ? updatedRule : r));
        } catch (error) {
            console.error('Failed to toggle rule:', error);
        }
    };

    const handleDeleteRule = async (ruleId: string) => {
        if (!workshopId || !window.confirm('Are you sure you want to delete this rule?')) return;
        try {
            await automationApi.deleteRule(workshopId, ruleId);
            setRules(rules.filter(r => r._id !== ruleId));
        } catch (error) {
            console.error('Failed to delete rule:', error);
        }
    };

    const handleOpenModal = (rule?: IAutomationRule) => {
        setEditingRule(rule);
        setIsModalOpen(true);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-[#050505] text-white">
            <header className="flex justify-between items-center mb-12">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mb-2"
                    >
                        Automation Engine
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-400 text-lg"
                    >
                        Supercharge your workflow with custom If-This-Then-That rules.
                    </motion.p>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold shadow-lg shadow-purple-900/20 hover:shadow-purple-500/40 transition-all"
                >
                    <Plus size={20} />
                    Create New Rule
                </motion.button>
            </header>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-800 rounded-3xl animate-pulse">
                    <Activity className="text-purple-500 mb-4" size={40} />
                    <p className="text-gray-500 text-xl font-medium">Synchronizing Rules...</p>
                </div>
            ) : rules.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-24 bg-[#0a0a0a] border border-gray-800 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-20" />
                    <div className="relative z-10">
                        <div className="w-24 h-24 bg-gray-900/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-800 shadow-inner">
                            <Zap className="text-gray-600" size={40} />
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-300 mb-3">No active automations found</h2>
                        <p className="text-gray-500 max-w-md mx-auto mb-8">
                            Automate repetitive tasks like status updates, notifications, and assignments to keep your team focused.
                        </p>
                        <button
                            onClick={() => handleOpenModal()}
                            className="text-purple-400 hover:text-purple-300 font-medium flex items-center gap-2 mx-auto decoration-purple-500/30 underline-offset-4 hover:underline"
                        >
                            Get started with your first rule <ChevronRight size={18} />
                        </button>
                    </div>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {rules.map((rule, index) => (
                            <motion.div
                                key={rule._id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: index * 0.05 }}
                                className={`group relative bg-[#0d0d0d] border ${rule.isActive ? 'border-gray-800' : 'border-gray-900'} rounded-3xl p-6 transition-all hover:bg-[#111111] hover:border-gray-700 shadow-xl overflow-hidden`}
                            >
                                {!rule.isActive && <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] z-10 pointer-events-none rounded-3xl" />}

                                <div className="flex justify-between items-start mb-6 relative z-20">
                                    <div className={`p-3 rounded-2xl ${rule.isActive ? 'bg-purple-500/10 text-purple-400' : 'bg-gray-800/50 text-gray-500'} transition-colors`}>
                                        <Zap size={24} />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleToggleRule(rule._id, rule.isActive)}
                                            className={`p-2.5 rounded-xl border border-gray-800 transition-all ${rule.isActive ? 'hover:bg-red-500/10 hover:border-red-500/30 text-green-500' : 'hover:bg-green-500/10 hover:border-green-500/30 text-gray-500'} z-20`}
                                        >
                                            {rule.isActive ? <Pause size={18} /> : <Play size={18} />}
                                        </button>
                                        <button
                                            onClick={() => handleOpenModal(rule)}
                                            className="p-2.5 rounded-xl border border-gray-800 hover:bg-white/5 hover:border-gray-600 text-gray-400 z-20"
                                        >
                                            <Settings2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteRule(rule._id)}
                                            className="p-2.5 rounded-xl border border-gray-800 hover:bg-red-500/10 hover:border-red-500/30 text-gray-400 hover:text-red-400 z-20"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4 relative z-20">
                                    <div>
                                        <h3 className="text-xl font-bold mb-1 group-hover:text-purple-400 transition-colors">{rule.name}</h3>
                                        <p className="text-gray-500 text-sm line-clamp-2">{rule.description || 'No description provided.'}</p>
                                    </div>

                                    <div className="py-4 space-y-3 bg-black/30 rounded-2xl px-4 border border-gray-800/30">
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            <span className="text-gray-400">Trigger:</span>
                                            <span className="text-gray-200 font-medium">{rule.trigger.type.replace(/_/g, ' ')}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                                            <span className="text-gray-400">Action:</span>
                                            <span className="text-gray-200 font-medium">{rule.actions[0]?.type.replace(/_/g, ' ')}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex items-center gap-2 text-xs text-gray-600 font-medium uppercase tracking-wider">
                                            {rule.isActive ? (
                                                <><CheckCircle2 size={14} className="text-green-500" /> Active</>
                                            ) : (
                                                <><XCircle size={14} className="text-gray-700" /> Inactive</>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-gray-700 font-bold uppercase tracking-widest">
                                            Created {new Date(rule.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {isModalOpen && (
                <RuleBuilderModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={fetchRules}
                    workshopId={workshopId!}
                    editingRule={editingRule}
                />
            )}
        </div>
    );
};

export default WorkshopAutomation;
