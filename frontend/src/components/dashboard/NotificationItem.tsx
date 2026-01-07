import React from 'react';
import { Notification } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkAsRead }) => {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <Card
      className={cn(
        'p-4 transition-colors cursor-pointer',
        !notification.isRead && 'bg-primary/5 border-primary/20'
      )}
      onClick={() => onMarkAsRead && !notification.isRead && onMarkAsRead(notification._id)}
    >
      <div className="flex gap-3">
        <div className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
          notification.isRead ? 'bg-muted' : 'bg-primary/10'
        )}>
          <Bell className={cn('h-5 w-5', notification.isRead ? 'text-muted-foreground' : 'text-primary')} />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium leading-none">{notification.title}</p>
            {!notification.isRead && <Badge variant="default" className="h-5 px-1.5 text-xs">New</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{notification.message}</p>
          <p className="text-xs text-muted-foreground">{formatTime(notification.createdAt)}</p>
        </div>
      </div>
    </Card>
  );
};
