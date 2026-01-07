import React, { useState } from 'react';
import { AuditLog, AuditAction, AuditLogFilters } from '@/types/workshop';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  Filter, 
  ChevronDown, 
  ChevronUp,
  Building,
  Users,
  Shield,
  FolderKanban,
  CheckSquare,
  AlertCircle
} from 'lucide-react';

interface AuditLogViewerProps {
  logs: AuditLog[];
  loading: boolean;
  hasMore: boolean;
  filters: AuditLogFilters;
  onFilterChange: (filters: AuditLogFilters) => void;
  onLoadMore: () => void;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  logs,
  loading,
  hasMore,
  filters,
  onFilterChange,
  onLoadMore
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const getActionCategory = (action: AuditAction): string => {
    if (action.startsWith('workshop_') || action.startsWith('manager_')) return 'workshop';
    if (action.startsWith('member_') || action.startsWith('join_request_')) return 'membership';
    if (action.startsWith('team_')) return 'team';
    if (action.startsWith('role_') || action.startsWith('permission_')) return 'role';
    if (action.startsWith('project_')) return 'project';
    if (action.startsWith('task_')) return 'task';
    return 'other';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'workshop':
        return <Building className="h-4 w-4" />;
      case 'membership':
        return <Users className="h-4 w-4" />;
      case 'team':
        return <Users className="h-4 w-4" />;
      case 'role':
        return <Shield className="h-4 w-4" />;
      case 'project':
        return <FolderKanban className="h-4 w-4" />;
      case 'task':
        return <CheckSquare className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'workshop':
        return 'bg-blue-100 text-blue-800';
      case 'membership':
        return 'bg-green-100 text-green-800';
      case 'team':
        return 'bg-purple-100 text-purple-800';
      case 'role':
        return 'bg-orange-100 text-orange-800';
      case 'project':
        return 'bg-cyan-100 text-cyan-800';
      case 'task':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatActionLabel = (action: AuditAction): string => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const actionOptions = Object.values(AuditAction);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {showFilters ? (
            <ChevronUp className="h-4 w-4 ml-2" />
          ) : (
            <ChevronDown className="h-4 w-4 ml-2" />
          )}
        </Button>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="pt-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Action</label>
                <Select
                  value={filters.action || ''}
                  onValueChange={(value) => 
                    onFilterChange({ ...filters, action: value as AuditAction || undefined })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All actions</SelectItem>
                    {actionOptions.map((action) => (
                      <SelectItem key={action} value={action}>
                        {formatActionLabel(action)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Target Type</label>
                <Select
                  value={filters.targetType || ''}
                  onValueChange={(value) => 
                    onFilterChange({ ...filters, targetType: value || undefined })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="membership">Membership</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="role">Role</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Actor ID</label>
                <Input
                  placeholder="Filter by actor..."
                  value={filters.actor || ''}
                  onChange={(e) => 
                    onFilterChange({ ...filters, actor: e.target.value || undefined })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Log entries */}
      {logs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {loading ? 'Loading audit logs...' : 'No audit logs found'}
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const actor = typeof log.actor === 'string' ? null : log.actor;
            const category = getActionCategory(log.action);
            const isExpanded = expandedLog === log._id;
            const timestamp = new Date(log.timestamp);

            return (
              <Card 
                key={log._id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedLog(isExpanded ? null : log._id)}
              >
                <CardContent className="py-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      {actor && (
                        <>
                          <AvatarImage src={actor.profilePhoto} />
                          <AvatarFallback className="text-xs">
                            {actor.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </>
                      )}
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {actor?.name || 'Unknown user'}
                        </span>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getCategoryColor(category)}`}
                        >
                          {getCategoryIcon(category)}
                          <span className="ml-1">{formatActionLabel(log.action)}</span>
                        </Badge>
                        {log.targetType && (
                          <Badge variant="outline" className="text-xs">
                            {log.targetType}
                          </Badge>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(timestamp, { addSuffix: true })}
                        {' · '}
                        {format(timestamp, 'MMM d, yyyy HH:mm')}
                      </div>

                      {/* Expanded details */}
                      {isExpanded && Object.keys(log.details).length > 0 && (
                        <div className="mt-3 p-2 bg-muted rounded text-xs">
                          <div className="font-medium mb-1">Details:</div>
                          <pre className="whitespace-pre-wrap overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={onLoadMore}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
};
