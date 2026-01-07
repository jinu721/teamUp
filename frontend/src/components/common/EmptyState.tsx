import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Inbox, 
  FileText, 
  Users, 
  Bell, 
  MessageSquare,
  FolderOpen,
  Search,
  Plus,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className
}) => {
  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">{description}</p>
        )}
        {action && (
          <Button onClick={action.onClick}>
            <Plus className="mr-2 h-4 w-4" />
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

// Pre-configured empty states for common use cases

export const EmptyProjects: React.FC<{ onCreateProject?: () => void }> = ({ 
  onCreateProject 
}) => (
  <EmptyState
    icon={FolderOpen}
    title="No projects yet"
    description="Get started by creating your first project"
    action={onCreateProject ? { label: 'Create Project', onClick: onCreateProject } : undefined}
  />
);

export const EmptyTasks: React.FC<{ onCreateTask?: () => void }> = ({ 
  onCreateTask 
}) => (
  <EmptyState
    icon={FileText}
    title="No tasks yet"
    description="Create your first task to get started"
    action={onCreateTask ? { label: 'Create Task', onClick: onCreateTask } : undefined}
  />
);

export const EmptyPosts: React.FC<{ onCreatePost?: () => void }> = ({ 
  onCreatePost 
}) => (
  <EmptyState
    icon={Users}
    title="No posts yet"
    description="Be the first to share a collaboration opportunity"
    action={onCreatePost ? { label: 'Post Opportunity', onClick: onCreatePost } : undefined}
  />
);

export const EmptyNotifications: React.FC = () => (
  <EmptyState
    icon={Bell}
    title="No notifications"
    description="You're all caught up!"
  />
);

export const EmptyMessages: React.FC = () => (
  <EmptyState
    icon={MessageSquare}
    title="No messages yet"
    description="Start a conversation with your team"
  />
);

export const EmptySearchResults: React.FC<{ query?: string }> = ({ query }) => (
  <EmptyState
    icon={Search}
    title="No results found"
    description={query ? `No results for "${query}"` : 'Try adjusting your search or filters'}
  />
);

export const EmptyTeamMembers: React.FC<{ onInvite?: () => void }> = ({ 
  onInvite 
}) => (
  <EmptyState
    icon={Users}
    title="No team members"
    description="Invite people to collaborate on this project"
    action={onInvite ? { label: 'Invite Member', onClick: onInvite } : undefined}
  />
);
