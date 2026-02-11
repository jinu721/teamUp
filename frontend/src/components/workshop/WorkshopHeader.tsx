import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Workshop, WorkshopVisibility, WORKSHOP_VISIBILITY_LABELS } from '@/types/workshop';
import { PROJECT_CATEGORY_LABELS } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Globe, Lock, Settings, MoreVertical, UserPlus, Trash2, Edit, MessageSquare, Zap } from 'lucide-react';

import { usePermissions } from '@/hooks';

interface WorkshopHeaderProps {
  workshop: Workshop;
  isOwner: boolean;
  isManager: boolean;
  isMember: boolean;
  isPending: boolean;
  onEdit?: () => void;
  onInvite?: () => void;
  onSettings?: () => void;
  onDelete?: () => void;
  onJoin?: () => void;
  submitting?: boolean;
}

export const WorkshopHeader: React.FC<WorkshopHeaderProps> = ({
  workshop,
  isOwner,
  isManager,
  isMember,
  isPending,
  onEdit,
  onInvite,
  onSettings,
  onDelete,
  onJoin,
  submitting
}) => {
  const navigate = useNavigate();
  const { can } = usePermissions(workshop._id);
  const [permissions, setPermissions] = useState({
    canEdit: false,
    canInvite: false
  });

  useEffect(() => {
    const loadPermissions = async () => {
      const [edit, inv] = await Promise.all([
        can('update', 'workshop'),
        can('invite', 'membership')
      ]);
      setPermissions({ canEdit: edit, canInvite: inv });
    };
    loadPermissions();
  }, [workshop._id, can]);

  const canManage = isOwner || isManager || permissions.canEdit || permissions.canInvite;
  const showJoinButton = !isMember && !isOwner;

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container py-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{workshop.name}</h1>
              <Badge variant={workshop.visibility === WorkshopVisibility.PUBLIC ? 'secondary' : 'outline'}>
                {workshop.visibility === WorkshopVisibility.PUBLIC ? (
                  <Globe className="h-3 w-3 mr-1" />
                ) : (
                  <Lock className="h-3 w-3 mr-1" />
                )}
                {WORKSHOP_VISIBILITY_LABELS[workshop.visibility]}
              </Badge>
              {workshop.category && (
                <Badge variant="secondary">
                  {PROJECT_CATEGORY_LABELS[workshop.category]}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground max-w-2xl">{workshop.description}</p>
          </div>

          <div className="flex items-center gap-2">
            {isMember && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/workshops/${workshop._id}/chat`)}
                className="gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Chat
              </Button>
            )}

            {showJoinButton && (
              <Button
                onClick={onJoin}
                disabled={submitting}
                className={isPending ? "bg-primary hover:bg-primary/90" : ""}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {isPending ? 'Accept Invitation' : 'Join Workshop'}
              </Button>
            )}

            {canManage && (
              <>
                <Button variant="outline" size="sm" onClick={onInvite}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onEdit}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Workshop
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onSettings}>
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(`/workshops/${workshop._id}/automation`)}>
                      <Zap className="h-4 w-4 mr-2" />
                      Automations
                    </DropdownMenuItem>

                    {isOwner && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={onDelete}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Workshop
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};