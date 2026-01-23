import React from 'react';
import { Notification, NotificationType } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bell,
  CheckCircle,
  MessageCircle,
  UserPlus,
  FileText,
  Users,
  Check,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationPanelProps {
  notifications: Notification[];
  loading?: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete?: (id: string) => void;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case NotificationType.TASK_ASSIGNED:
      return FileText;
    case NotificationType.TASK_UPDATED:
      return CheckCircle;
    case NotificationType.MESSAGE:
      return MessageCircle;
    case NotificationType.PROJECT_INVITE:
      return Users;
    case NotificationType.JOIN_REQUEST:
      return UserPlus;
    case NotificationType.COMMENT:
      return MessageCircle;
    default:
      return Bell;
  }
};

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete
}) => {
  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return <NotificationPanelSkeleton />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </CardTitle>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onMarkAllAsRead}>
            Mark all read
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification._id}
              notification={notification}
              onMarkAsRead={onMarkAsRead}
              onDelete={onDelete}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete
}) => {
  const Icon = getNotificationIcon(notification.type);

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg transition-colors",
        notification.isRead ? "bg-background" : "bg-muted/50"
      )}
    >
      <div className={cn(
        "rounded-full p-2",
        notification.isRead ? "bg-muted" : "bg-primary/10"
      )}>
        <Icon className={cn(
          "h-4 w-4",
          notification.isRead ? "text-muted-foreground" : "text-primary"
        )} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm",
          !notification.isRead && "font-medium"
        )}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(notification.createdAt).toLocaleDateString()}
        </p>
      </div>
      <div className="flex gap-1">
        {!notification.isRead && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onMarkAsRead(notification._id)}
            title="Mark as read"
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(notification._id)}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export const NotificationPanelSkeleton: React.FC = () => (
  <Card>
    <CardHeader className="pb-2">
      <Skeleton className="h-6 w-32" />
    </CardHeader>
    <CardContent className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-3 p-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);