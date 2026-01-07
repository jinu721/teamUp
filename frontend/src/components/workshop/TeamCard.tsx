import React from 'react';
import { Team } from '@/types/workshop';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Shield } from 'lucide-react';

interface TeamCardProps {
  team: Team;
  workshopId: string;
  onClick?: () => void;
}

export const TeamCard: React.FC<TeamCardProps> = ({ team, onClick }) => {
  const memberCount = team.members.length;
  const roleCount = team.internalRoles.length;

  return (
    <Card 
      className="transition-all hover:shadow-md cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{team.name}</CardTitle>
            {team.description && (
              <CardDescription className="line-clamp-2">{team.description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
          </div>
          {roleCount > 0 && (
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>{roleCount} {roleCount === 1 ? 'role' : 'roles'}</span>
            </div>
          )}
        </div>

        {/* Member avatars */}
        {memberCount > 0 && (
          <div className="flex -space-x-2">
            {team.members.slice(0, 5).map((member, idx) => {
              const user = typeof member === 'string' ? null : member;
              if (!user) return null;
              
              return (
                <Avatar key={idx} className="h-8 w-8 border-2 border-background">
                  <AvatarImage src={user.profilePhoto} />
                  <AvatarFallback className="text-xs">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              );
            })}
            {memberCount > 5 && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
                +{memberCount - 5}
              </div>
            )}
          </div>
        )}

        {/* Internal roles */}
        {roleCount > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {team.internalRoles.slice(0, 3).map((role, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {role.name}
              </Badge>
            ))}
            {roleCount > 3 && (
              <Badge variant="outline" className="text-xs">
                +{roleCount - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
