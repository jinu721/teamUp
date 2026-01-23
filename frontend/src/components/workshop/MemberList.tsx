import React from 'react';
import { Membership, MembershipState, MEMBERSHIP_STATE_LABELS, MEMBERSHIP_SOURCE_LABELS, Role } from '@/types/workshop';
import { User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Check, X, MoreVertical, UserMinus, Clock, UserCheck, Shield } from 'lucide-react';

interface MemberListProps {
  members: Membership[];
  roles?: Role[];
  canManage: boolean;
  currentUserId?: string;
  workshopOwnerId?: string;
  onApprove?: (membershipId: string) => void;
  onReject?: (membershipId: string) => void;
  onRevoke?: (userId: string) => void;
  onAssignRole?: (userId: string, roleId: string) => void;
  onRemoveRole?: (userId: string, roleId: string) => void;
}

export const MemberList: React.FC<MemberListProps> = ({
  members,
  roles = [],
  canManage,
  currentUserId,
  workshopOwnerId,
  onApprove,
  onReject,
  onRevoke,
  onAssignRole,
  onRemoveRole
}) => {
  const getUser = (membership: Membership): User | null => {
    return typeof membership.user === 'string' ? null : membership.user;
  };

  const getStateIcon = (state: MembershipState) => {
    switch (state) {
      case MembershipState.PENDING:
        return <Clock className="h-3 w-3" />;
      case MembershipState.ACTIVE:
        return <UserCheck className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getStateBadgeVariant = (state: MembershipState) => {
    switch (state) {
      case MembershipState.PENDING:
        return 'secondary' as const;
      case MembershipState.ACTIVE:
        return 'default' as const;
      case MembershipState.REMOVED:
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No members found
      </div>
    );
  }

  console.log('[MemberList] Rendering members:', members.length);
  const unpopulatedMembers = members.filter(m => typeof m.user === 'string');
  if (unpopulatedMembers.length > 0) {
    console.warn('[MemberList] Found unpopulated members:', unpopulatedMembers.map(m => ({ id: m._id, user: m.user })));
  }

  return (
    <div className="space-y-3">
      {members.map((membership) => {
        const user = getUser(membership);
        if (!user) {
          console.warn('[MemberList] Skipping membership due to unpopulated user:', membership);
          return (
            <div
              key={membership._id}
              className="flex items-center justify-between p-3 rounded-lg border bg-yellow-50 border-yellow-200"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="text-sm text-yellow-800">
                  ⚠️ Invalid invitation - User not found
                </div>
              </div>
              {canManage && membership.state === MembershipState.PENDING && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-red-600 hover:text-red-700 border-red-300"
                  onClick={() => onReject?.(membership._id)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              )}
            </div>
          );
        }

        const isOwner = user._id === workshopOwnerId;

        return (
          <div
            key={membership._id}
            className="flex items-center justify-between p-4 rounded-xl border bg-card/50 hover:bg-card/80 transition-all shadow-sm"
          >
            <div className="flex items-center gap-4">
              <Avatar className="h-11 w-11 shadow-sm border border-border/50">
                <AvatarImage src={user.profilePhoto} />
                <AvatarFallback className="bg-primary/5 text-primary">
                  {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : '??'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{user.name}</span>
                  {isOwner && (
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                      Owner
                    </Badge>
                  )}
                  {user._id === currentUserId && (
                    <Badge variant="outline" className="text-xs">You</Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
                {(membership.roles && membership.roles.length > 0) && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {membership.roles.map(role => (
                      <Badge key={role._id} variant="secondary" className="text-[9px] h-4 px-1.5 font-normal bg-primary/5 text-primary border-primary/10">
                        {role.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end gap-1 mr-2">
                <Badge variant={getStateBadgeVariant(membership.state)} className="text-[10px] font-medium h-5">
                  {getStateIcon(membership.state)}
                  <span className="ml-1 uppercase tracking-wider">{MEMBERSHIP_STATE_LABELS[membership.state]}</span>
                </Badge>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">
                  Via {MEMBERSHIP_SOURCE_LABELS[membership.source]}
                </span>
              </div>

              {canManage && membership.state === MembershipState.PENDING && (
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 px-3 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full"
                    onClick={() => onApprove?.(membership._id)}
                  >
                    <Check className="h-4 w-4 mr-1.5" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
                    onClick={() => onReject?.(membership._id)}
                  >
                    <X className="h-4 w-4 mr-1.5" />
                    Reject
                  </Button>
                </div>
              )}

              {canManage && membership.state === MembershipState.ACTIVE && !isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {roles.length > 0 && (
                      <>
                        <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
                          Assign Role
                        </DropdownMenuLabel>
                        {roles
                          .filter(role => !membership.roles?.some(r => r._id === role._id))
                          .map(role => (
                            <DropdownMenuItem
                              key={role._id}
                              onClick={() => onAssignRole?.(user._id, role._id)}
                              className="text-xs py-2"
                            >
                              <Shield className="h-3.5 w-3.5 mr-2 text-primary" />
                              {role.name}
                            </DropdownMenuItem>
                          ))}

                        {membership.roles && membership.roles.length > 0 && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
                              Remove Role
                            </DropdownMenuLabel>
                            {membership.roles.map(role => (
                              <DropdownMenuItem
                                key={role._id}
                                onClick={() => onRemoveRole?.(user._id, role._id)}
                                className="text-xs py-2 text-orange-600 focus:text-orange-700"
                              >
                                <X className="h-3.5 w-3.5 mr-2" />
                                {role.name}
                              </DropdownMenuItem>
                            ))}
                          </>
                        )}
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={() => onRevoke?.(user._id)}
                      className="text-destructive focus:text-destructive text-xs py-2"
                    >
                      <UserMinus className="h-3.5 w-3.5 mr-2" />
                      Remove Member
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};