import React, { useEffect, useState } from 'react';
import { Bell, Inbox, Check, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Notification, NotificationType } from '@/types';
import api from '@/services/api';
import socketService from '@/services/socket';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export const NotificationPopover: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await api.getNotifications(10);
            setNotifications(response.data);

            const countResponse = await api.getUnreadCount();
            setUnreadCount(countResponse.data.count);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();

        const handleNewNotification = (notification: Notification) => {
            setNotifications(prev => [notification, ...prev].slice(0, 10));
            setUnreadCount(prev => prev + 1);
        };

        socketService.on('notification:new', handleNewNotification);
        return () => {
            socketService.off('notification:new', handleNewNotification);
        };
    }, []);

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await api.markNotificationAsRead(id);
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await api.markAllNotificationsAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            api.markNotificationAsRead(notification._id);
            setUnreadCount(prev => Math.max(0, prev - 1));
        }

        // Navigation logic
        // Navigation logic
        if (notification.type === NotificationType.TASK_ASSIGNED ||
            notification.type === NotificationType.TASK_UPDATED ||
            notification.type === NotificationType.COMMENT) {

            if (notification.relatedWorkshop && notification.relatedProject && notification.relatedTask) {
                const workshopId = typeof notification.relatedWorkshop === 'string'
                    ? notification.relatedWorkshop
                    : notification.relatedWorkshop._id;
                const projectId = typeof notification.relatedProject === 'string'
                    ? notification.relatedProject
                    : notification.relatedProject._id;
                const taskId = typeof notification.relatedTask === 'string'
                    ? notification.relatedTask
                    : notification.relatedTask._id;

                navigate(`/workshops/${workshopId}/projects/${projectId}/tasks/${taskId}`);
                return;
            }
        }

        if (notification.relatedProject) {
            // Fallback or just project notification
            const projectId = typeof notification.relatedProject === 'string'
                ? notification.relatedProject
                : notification.relatedProject._id;

            // If we have workshopId we can go to project, otherwise go to notifications page
            if (notification.relatedWorkshop) {
                const workshopId = typeof notification.relatedWorkshop === 'string'
                    ? notification.relatedWorkshop
                    : notification.relatedWorkshop._id;
                navigate(`/workshops/${workshopId}/projects/${projectId}`);
                return;
            }
        }

        navigate('/notifications');
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-primary/20 transition-all">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-in zoom-in duration-300">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 pb-2">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            className="h-auto p-0 text-xs text-primary hover:bg-transparent"
                        >
                            Mark all read
                        </Button>
                    )}
                </div>
                <Separator className="mt-2" />
                <ScrollArea className="h-[350px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                            <Inbox className="h-8 w-8 text-muted-foreground/30 mb-2" />
                            <p className="text-xs text-muted-foreground">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={cn(
                                        "flex flex-col gap-1 p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b last:border-0",
                                        !notification.isRead && "bg-primary/[0.03]"
                                    )}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <span className={cn(
                                            "text-xs leading-snug",
                                            !notification.isRead ? "font-bold text-foreground" : "text-muted-foreground"
                                        )}>
                                            {notification.title}
                                        </span>
                                        {!notification.isRead && (
                                            <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                                        )}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                                        {notification.message}
                                    </p>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-[10px] text-muted-foreground">
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                        </span>
                                        {!notification.isRead && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-1.5 text-[10px] hover:bg-primary/10 hover:text-primary"
                                                onClick={(e) => handleMarkAsRead(notification._id, e)}
                                            >
                                                <Check className="h-3 w-3 mr-1" />
                                                Mark read
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <Separator />
                <div className="p-2">
                    <Button
                        variant="ghost"
                        className="w-full justify-center text-xs font-medium h-9"
                        onClick={() => navigate('/notifications')}
                    >
                        <ExternalLink className="h-3.5 w-3.5 mr-2" />
                        View all notifications
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};
