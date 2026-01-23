import { useState, useEffect, useCallback } from 'react';
import { Notification } from '@/types';
import api from '@/services/api';
import { useSocketEvent } from './useSocket';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

export function useNotifications(limit: number = 50): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getNotifications(limit);
      setNotifications(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await api.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }, []);

  useSocketEvent('notification:new', (notification: Notification) => {
    setNotifications(prev => {
      if (prev.some(n => n._id === notification._id)) return prev;
      return [notification, ...prev].slice(0, limit);
    });
  });

  useSocketEvent('notification:read', (data: { notificationId: string }) => {
    setNotifications(prev =>
      prev.map(n => n._id === data.notificationId ? { ...n, isRead: true } : n)
    );
  });

  useSocketEvent('notification:allRead', () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  });

  useSocketEvent('notification:deleted', (data: { notificationId: string }) => {
    setNotifications(prev => prev.filter(n => n._id !== data.notificationId));
  });

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
}

export function useUnreadCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = useCallback(async () => {
    try {
      const response = await api.getUnreadCount();
      setCount(response.data.count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  useSocketEvent('notification:new', () => {
    setCount(prev => prev + 1);
  });

  useSocketEvent('notification:read', () => {
    setCount(prev => Math.max(0, prev - 1));
  });

  useSocketEvent('notification:allRead', () => {
    setCount(0);
  });

  return { count, loading, refetch: fetchCount };
}