import React from 'react';
import { WorkshopTask, TaskType } from '@/types/workshop';
import {
    Bug,
    Lightbulb,
    Sparkles,
    MessageSquare,
    Clock,
    ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface DashboardTaskItemProps {
    task: WorkshopTask;
}

export const DashboardTaskItem: React.FC<DashboardTaskItemProps> = ({ task }) => {
    const getTypeIcon = (type: TaskType) => {
        switch (type) {
            case TaskType.BUG: return <Bug className="h-3 w-3" />;
            case TaskType.FEATURE: return <Lightbulb className="h-3 w-3" />;
            case TaskType.ENHANCEMENT: return <Sparkles className="h-3 w-3" />;
            case TaskType.DISCUSSION: return <MessageSquare className="h-3 w-3" />;
            default: return <Lightbulb className="h-3 w-3" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'todo': return 'bg-slate-100 text-slate-600';
            case 'in_progress': return 'bg-blue-100 text-blue-600';
            case 'done': return 'bg-green-100 text-green-600';
            case 'blocked': return 'bg-red-100 text-red-600';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    const project = typeof task.project === 'string' ? null : task.project;
    const workshopId = project?.workshop ? (typeof project.workshop === 'string' ? project.workshop : project.workshop._id) : '';
    const projectId = project?._id || '';

    return (
        <Link
            to={`/workshops/${workshopId}/projects/${projectId}/tasks/${task._id}`}
            className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card hover:bg-background hover:shadow-md hover:border-primary/20 transition-all duration-300 group"
        >
            <div className={cn("p-2.5 rounded-lg shrink-0 transition-transform group-hover:scale-110", getStatusColor(task.status))}>
                {getTypeIcon(task.type)}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold truncate group-hover:text-primary transition-colors tracking-tight">
                        {task.title}
                    </h4>
                    {task.priority >= 3 && (
                        <span className="flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse shrink-0" title="High Priority" />
                    )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground truncate max-w-[120px] uppercase tracking-wider">
                        {project?.name || 'Project'}
                    </span>
                    <span className="text-[10px] text-muted-foreground/50">•</span>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                        <Clock className="h-2.5 w-2.5" />
                        <span>{new Date(task.updatedAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
        </Link>
    );
};
