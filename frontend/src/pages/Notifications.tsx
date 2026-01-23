import React, { useEffect, useState, useCallback } from 'react';
import { Notification, NotificationType } from '@/types';
import api from '@/services/api';
import socketService from '@/services/socket';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  CheckCircle,
  MessageCircle,
  UserPlus,
  FileText,
  Users,
  Check,
  Trash2,
  CheckCheck,
  Inbox
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

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

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case NotificationType.TASK_ASSIGNED:
      return 'text-blue-500 bg-blue-50';
    case NotificationType.TASK_UPDATED:
      return 'text-green-500 bg-green-50';
    case NotificationType.MESSAGE:
      return 'text-purple-500 bg-purple-50';
    case NotificationType.PROJECT_INVITE:
      return 'text-indigo-500 bg-indigo-50';
    case NotificationType.JOIN_REQUEST:
      return 'text-orange-500 bg-orange-50';
    case NotificationType.COMMENT:
      return 'text-pink-500 bg-pink-50';
    default:
      return 'text-gray-500 bg-gray-50';
  }
};

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadNotifications = useCallback(async () => {
    try {
      const response = await api.getNotifications(100);
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadNotifications();

    const handleNewNotification = (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
    };

    const handleNotificationRead = (data: { notificationId: string }) => {
      setNotifications(prev =>
        prev.map(n => n._id === data.notificationId ? { ...n, isRead: true } : n)
      );
    };

    const handleAllRead = () => {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    socketService.on('notification:new', handleNewNotification);
    socketService.on('notification:read', handleNotificationRead);
    socketService.on('notification:allRead', handleAllRead);

    return () => {
      socketService.off('notification:new', handleNewNotification);
      socketService.off('notification:read', handleNotificationRead);
      socketService.off('notification:allRead', handleAllRead);
    };
  }, [loadNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast({
        title: 'Done',
        description: 'All notifications marked as read',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark all as read',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive',
      });
    }
  };

  const handleNotificationClick = (notification: Notification) => {

    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }

    if (notification.relatedProject) {
      navigate(`/projects/${notification.relatedProject._id || notification.relatedProject}`);
    } else if (notification.type === NotificationType.JOIN_REQUEST) {
      navigate('/community');
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <AppLayout>
        <div className="page-container">
          <Skeleton className="h-12 w-64" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-container max-w-3xl mx-auto">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="section-header mb-0">
            <h1 className="section-title flex items-center gap-2">
              <Bell className="h-7 w-7 text-primary" />
              Notifications
              {unreadCount > 0 && (
                <Badge className="ml-2">{unreadCount} new</Badge>
              )}
            </h1>
            <p className="section-description">Stay updated on your projects and community</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead} className="w-full sm:w-auto">
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <Inbox className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No notifications</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                You're all caught up! New notifications will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              const colorClass = getNotificationColor(notification.type);

              return (
                <Card
                  key={notification._id}
                  className={cn(
                    "shadow-soft transition-all cursor-pointer hover:shadow-soft-lg",
                    !notification.isRead && "border-l-4 border-l-primary"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={cn("rounded-full p-2.5 shrink-0", colorClass)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className={cn(
                              "text-sm",
                              !notification.isRead && "font-semibold"
                            )}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification._id);
                                }}
                                title="Mark as read"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(notification._id);
                              }}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(notification.createdAt).toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Notifications;