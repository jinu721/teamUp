import React from 'react';
import { Link } from 'react-router-dom';
import { Workshop, WorkshopVisibility, WORKSHOP_VISIBILITY_LABELS } from '@/types/workshop';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Crown, Shield, Globe, Lock } from 'lucide-react';

interface WorkshopCardProps {
  workshop: Workshop;
  currentUserId?: string;
  memberCount?: number;
}

export const WorkshopCard: React.FC<WorkshopCardProps> = ({
  workshop,
  currentUserId,
  memberCount = 0
}) => {
  const isOwner = typeof workshop.owner === 'string'
    ? workshop.owner === currentUserId
    : workshop.owner._id === currentUserId;

  const isManager = workshop.managers.some(m => {
    const managerId = typeof m === 'string' ? m : m._id;
    return managerId === currentUserId;
  });

  const getUserRole = () => {
    if (isOwner) return { label: 'Owner', icon: Crown, variant: 'default' as const };
    if (isManager) return { label: 'Manager', icon: Shield, variant: 'secondary' as const };
    return { label: 'Member', icon: Users, variant: 'outline' as const };
  };

  const role = getUserRole();
  const RoleIcon = role.icon;

  const ownerUser = typeof workshop.owner === 'string' ? null : workshop.owner;

  return (
    <Link to={`/workshops/${workshop._id}`}>
      <Card className="transition-all hover:shadow-md cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1 min-w-0">
              <CardTitle className="text-lg truncate leading-tight">{workshop.name}</CardTitle>
              <CardDescription className="line-clamp-2 text-sm">{workshop.description}</CardDescription>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <Badge variant={workshop.visibility === WorkshopVisibility.PUBLIC ? 'secondary' : 'outline'} className="text-xs">
                {workshop.visibility === WorkshopVisibility.PUBLIC ? (
                  <Globe className="h-3 w-3 mr-1" />
                ) : (
                  <Lock className="h-3 w-3 mr-1" />
                )}
                {WORKSHOP_VISIBILITY_LABELS[workshop.visibility]}
              </Badge>
              {currentUserId && (
                <Badge variant={role.variant} className="text-xs">
                  <RoleIcon className="h-3 w-3 mr-1" />
                  {role.label}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{memberCount} members</span>
            </div>
            {ownerUser && (
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs whitespace-nowrap">Owner:</span>
                <Avatar className="h-6 w-6 flex-shrink-0">
                  <AvatarImage src={ownerUser.profilePhoto} />
                  <AvatarFallback className="text-xs">
                    {ownerUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs truncate">{ownerUser.name}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};