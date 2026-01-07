import React from 'react';
import { Team } from '@/types/workshop';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreVertical, UserMinus, Shield, Plus } from 'lucide-react';

interface TeamMemberListProps {
  team: Team;
  canManage: boolean;
  onAddMember?: () => void;
  onRemoveMember?: (userId: string) => void;
  onAssignRole?: (userId: string, roleName: string) => void;
  onRemoveRole?: (userId: string, roleName: string) => void;
}

export const TeamMemberList: React.FC<TeamMemberListProps> = ({
  team,
  canManage,
  onAddMember,
  onRemoveMember,
  onAssignRole,
  onRemoveRole
}) => {
  const getMemberRoles = (userId: string): string[] => {
    const roles: string[] = [];
    team.internalRoles.forEach(role => {
      const hasMember = role.members.some(m => {
        const memberId = typeof m === 'string' ? m : m._id;
        return memberId === userId;
      });
      if (hasMember) {
        roles.push(role.name);
      }
    });
    return roles;
  };

  const availableRoles = team.internalRoles.map(r => r.name);

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onAddMember}>
            <Plus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </div>
      )}

      {team.members.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No team members yet
        </div>
      ) : (
        <div className="space-y-2">
          {team.members.map((member) => {
            const user = typeof member === 'string' ? null : member;
            if (!user) return null;

            const memberRoles = getMemberRoles(user._id);
            const unassignedRoles = availableRoles.filter(r => !memberRoles.includes(r));

            return (
              <div 
                key={user._id} 
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.profilePhoto} />
                    <AvatarFallback>
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Member roles */}
                  <div className="flex flex-wrap gap-1">
                    {memberRoles.map((roleName) => (
                      <Badge key={roleName} variant="secondary" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        {roleName}
                        {canManage && (
                          <button
                            className="ml-1 hover:text-destructive"
                            onClick={() => onRemoveRole?.(user._id, roleName)}
                          >
                            ×
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>

                  {canManage && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {unassignedRoles.length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                              Assign Role
                            </div>
                            {unassignedRoles.map((roleName) => (
                              <DropdownMenuItem 
                                key={roleName}
                                onClick={() => onAssignRole?.(user._id, roleName)}
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                {roleName}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem 
                          onClick={() => onRemoveMember?.(user._id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <UserMinus className="h-4 w-4 mr-2" />
                          Remove from Team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
