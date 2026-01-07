import React from 'react';
import { TaskActivity } from '@/types/workshop';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface TaskActivityHistoryProps {
  activities: TaskActivity[];
}

export const TaskActivityHistory: React.FC<TaskActivityHistoryProps> = ({ activities }) => {
  const formatChanges = (changes: Record<string, { old: unknown; new: unknown }>) => {
    return Object.entries(changes).map(([field, { old: oldVal, new: newVal }]) => ({
      field,
      oldValue: formatValue(oldVal),
      newValue: formatValue(newVal)
    }));
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'none';
    if (typeof value === 'boolean') return value ? 'yes' : 'no';
    if (Array.isArray(value)) return value.length === 0 ? 'none' : `${value.length} items`;
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const getActionLabel = (action: string): string => {
    const actionLabels: Record<string, string> = {
      'created': 'created this task',
      'updated': 'updated',
      'status_changed': 'changed status',
      'assigned': 'assigned',
      'unassigned': 'unassigned',
      'dependency_added': 'added dependency',
      'dependency_removed': 'removed dependency',
      'comment_added': 'commented'
    };
    return actionLabels[action] || action;
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No activity recorded yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => {
        const user = typeof activity.user === 'string' ? null : activity.user;
        const changes = formatChanges(activity.changes);
        const timestamp = new Date(activity.timestamp);

        return (
          <div key={index} className="flex gap-3">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <Avatar className="h-8 w-8 shrink-0">
                {user && (
                  <>
                    <AvatarImage src={user.profilePhoto} />
                    <AvatarFallback className="text-xs">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
              {index < activities.length - 1 && (
                <div className="w-px flex-1 bg-border mt-2" />
              )}
            </div>

            {/* Activity content */}
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{user?.name || 'Unknown user'}</span>
                <span className="text-muted-foreground">{getActionLabel(activity.action)}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(timestamp, { addSuffix: true })}
                </span>
              </div>

              {/* Changes */}
              {changes.length > 0 && (
                <div className="mt-2 space-y-1">
                  {changes.map((change, changeIdx) => (
                    <div key={changeIdx} className="flex items-center gap-2 text-xs">
                      <Badge variant="outline" className="font-mono">
                        {change.field}
                      </Badge>
                      <span className="text-muted-foreground line-through">
                        {change.oldValue}
                      </span>
                      <span>→</span>
                      <span className="font-medium">{change.newValue}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
