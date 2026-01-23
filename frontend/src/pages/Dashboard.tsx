import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Notification } from '@/types';
import { Workshop } from '@/types/workshop';
import api from '@/services/api';
import socketService from '@/services/socket';
import { AppLayout } from '@/components/layout/AppLayout';
import { NotificationItem } from '@/components/dashboard/NotificationItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Inbox, Building as WorkshopIcon, Users, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Dashboard: React.FC = () => {
  const { } = useAuth();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    setupSocketListeners();

    return () => {
      socketService.off('notification:new', handleNewNotification);
    };
  }, []);

  const loadData = async () => {
    try {
      const [workshopsRes, notificationsRes] = await Promise.all([
        api.getWorkshops(),
        api.getNotifications(10)
      ]);
      setWorkshops(workshopsRes.data);
      setNotifications(notificationsRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    socketService.on('notification:new', handleNewNotification);
  };

  const handleNewNotification = (notification: Notification) => {
    setNotifications(prev => {
      if (prev.some(n => n._id === notification._id)) return prev;
      return [notification, ...prev].slice(0, 10);
    });
    toast({
      title: notification.title,
      description: notification.message,
    });
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="page-container">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-container">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="section-header mb-0">
            <h1 className="section-title flex items-center gap-2">
              <WorkshopIcon className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
              My Workshops
            </h1>
            <p className="section-description">Manage your collaboration hubs</p>
          </div>
          <Button className="w-full sm:w-auto" asChild>
            <Link to="/workshops">
              <Plus className="mr-2 h-4 w-4" />
              New Workshop
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">

          <div className="lg:col-span-2 space-y-4">
            {workshops.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                    <Inbox className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No workshops yet</h3>
                  <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                    Create your first workshop to start collaborating with your team
                  </p>
                  <Button asChild>
                    <Link to="/workshops">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Workshop
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {workshops.map(workshop => (
                  <Card key={workshop._id} className="shadow-soft hover:shadow-soft-lg transition-shadow cursor-pointer">
                    <Link to={`/workshops/${workshop._id}`}>
                      <CardHeader>
                        <CardTitle className="text-lg">{workshop.name}</CardTitle>
                        <CardDescription className="line-clamp-2">{workshop.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span className="capitalize">{workshop.visibility}</span>
                          <span>{new Date(workshop.createdAt).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 sm:space-y-6">

            <Card className="shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Recent Notifications</CardTitle>
                <CardDescription>Stay updated with your team</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No notifications</p>
                ) : (
                  notifications.map(notif => (
                    <NotificationItem
                      key={notif._id}
                      notification={notif}
                      onMarkAsRead={handleMarkAsRead}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-between group" asChild>
                  <Link to="/community">
                    <span className="flex items-center">
                      <Users className="mr-2 h-4 w-4" />
                      Explore Community
                    </span>
                    <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;