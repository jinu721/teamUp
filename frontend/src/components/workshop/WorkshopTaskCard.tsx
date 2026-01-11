import React from 'react';
import { WorkshopTask, TaskType } from '@/types/workshop';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Bug,
  Lightbulb,
  Sparkles,
  MessageSquare,
  ArrowUp,
  Calendar,
  Shield,
  Clock
} from 'lucide-react';
import { format, isPast } from 'date-fns';

interface WorkshopTaskCardProps {
  task: WorkshopTask;
  onClick?: () => void;
}

export const WorkshopTaskCard: React.FC<WorkshopTaskCardProps> = ({ task, onClick }) => {
  const getTypeIcon = (type: TaskType) => {
    switch (type) {
      case TaskType.BUG: return <Bug className="h-4 w-4" />;
      case TaskType.FEATURE: return <Lightbulb className="h-4 w-4" />;
      case TaskType.ENHANCEMENT: return <Sparkles className="h-4 w-4" />;
      case TaskType.DISCUSSION: return <MessageSquare className="h-4 w-4" />;
      default: return null;
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'text-red-500';
    if (priority >= 3) return 'text-orange-500';
    if (priority >= 2) return 'text-yellow-500';
    return 'text-blue-400';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'todo': return <Badge variant="outline" className="bg-slate-50 text-[10px] py-0 h-4">To Do</Badge>;
      case 'in_progress': return <Badge variant="default" className="bg-blue-600 text-[10px] py-0 h-4">In Progress</Badge>;
      case 'done': return <Badge variant="default" className="bg-green-600 text-[10px] py-0 h-4">Done</Badge>;
      case 'blocked': return <Badge variant="destructive" className="text-[10px] py-0 h-4">Blocked</Badge>;
      default: return <Badge variant="outline" className="text-[10px] py-0 h-4">{status}</Badge>;
    }
  };

  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';

  return (
    <Card
      className="transition-all hover:shadow-lg cursor-pointer border-slate-200 group overflow-hidden"
      onClick={onClick}
    >
      <div className={`h-1 w-full ${getPriorityColor(task.priority).replace('text-', 'bg-')}`} />
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {getStatusBadge(task.status)}
              <span className="text-[10px] text-muted-foreground font-mono">#{task._id.slice(-4)}</span>
            </div>
            <CardTitle className="text-sm font-bold line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
              {task.title}
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-4">
        {/* Meta info */}
        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1 font-semibold">
            <ArrowUp className={`h-3 w-3 ${getPriorityColor(task.priority)}`} />
            <span>P{task.priority}</span>
          </div>

          {task.dueDate && (
            <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(task.dueDate), 'MMM d')}</span>
              {isOverdue && <Clock className="h-2 w-2 ml-0.5 animate-pulse" />}
            </div>
          )}

          {((task.estimatedHours as any) || 0) > 0 && (
            <div className="flex items-center gap-1 text-slate-500">
              <Clock className="h-3 w-3" />
              <span>{task.estimatedHours}h</span>
            </div>
          )}
        </div>

        {/* Labels */}
        {task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.labels.slice(0, 2).map((label, idx) => (
              <Badge key={idx} variant="secondary" className="text-[9px] px-1.5 py-0 h-4 border-none bg-slate-100">
                {label}
              </Badge>
            ))}
            {task.labels.length > 2 && (
              <span className="text-[9px] text-slate-400">+{task.labels.length - 2}</span>
            )}
          </div>
        )}

        {/* Footer with People */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-slate-50 text-slate-400">
              {getTypeIcon(task.type)}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Primary Owner */}
            {task.primaryOwner && (
              <div className="relative">
                <Avatar className="h-6 w-6 ring-2 ring-white">
                  <AvatarImage src={task.primaryOwner.profilePhoto} />
                  <AvatarFallback className="text-[10px] bg-slate-100">
                    {task.primaryOwner.name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                  <Shield className="h-2 w-2 text-indigo-500 fill-indigo-50" />
                </div>
              </div>
            )}

            {/* Other Assignees (max 2) */}
            <div className="flex -space-x-2">
              {task.assignedIndividuals.filter(i => (typeof i === 'string' ? i : i._id) !== (typeof task.primaryOwner === 'string' ? task.primaryOwner : task.primaryOwner?._id)).slice(0, 2).map((individual, idx) => {
                const user = typeof individual === 'string' ? null : individual;
                if (!user) return null;
                return (
                  <Avatar key={idx} className="h-6 w-6 ring-2 ring-white grayscale-[0.5] hover:grayscale-0 transition-all">
                    <AvatarImage src={user.profilePhoto} />
                    <AvatarFallback className="text-[10px]">{user.name[0]}</AvatarFallback>
                  </Avatar>
                );
              })}
              {task.assignedIndividuals.length > 3 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-white bg-slate-50 text-[8px] text-slate-500">
                  +{task.assignedIndividuals.length - 3}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
