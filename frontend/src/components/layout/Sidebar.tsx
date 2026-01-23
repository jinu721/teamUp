import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Bell, X, Building } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Workshops', href: '/workshops', icon: Building },
  { name: 'Discover', href: '/community', icon: Users },
  { name: 'Notifications', href: '/notifications', icon: Bell },
];

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const location = useLocation();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card shadow-soft">

      <div className="flex h-16 items-center justify-between border-b px-4 lg:px-6">
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <span className="text-xl font-bold tracking-tight">TeamUp</span>
        </Link>

        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close sidebar</span>
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-3 lg:p-4">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Menu
        </p>
        {navigation.map((item) => {
          const isActive = location.pathname === item.href ||
            (item.href === '/dashboard' && location.pathname.startsWith('/projects')) ||
            (item.href === '/workshops' && location.pathname.startsWith('/workshops'));
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'animate-fade-in')} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs font-medium text-muted-foreground">
            Need help?
          </p>
          <p className="mt-1 text-xs text-muted-foreground/80">
            Check our docs or contact support
          </p>
        </div>
      </div>
    </div>
  );
};