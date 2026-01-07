import React from 'react';
import { WorkshopProject } from '@/types/workshop';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, User as UserIcon, Crown, Wrench, Plus, X } from 'lucide-react';

interface ProjectAssignmentPanelProps {
  project: WorkshopProject;
  canManage: boolean;
  onAssignTeam?: () => void;
  onRemoveTeam?: (teamId: string) => void;
  onAssignIndividual?: () => void;
  onRemoveIndividual?: (userId: string) => void;
  onAssignManager?: () => void;
  onAssignMaintainer?: () => void;
  onRemoveMaintainer?: (userId: string) => void;
}

export const ProjectAssignmentPanel: React.FC<ProjectAssignmentPanelProps> = ({
  project,
  canManage,
  onAssignTeam,
  onRemoveTeam,
  onAssignIndividual,
  onRemoveIndividual,
  onAssignManager,
  onAssignMaintainer,
  onRemoveMaintainer
}) => {
  const projectManager = project.projectManager
    ? (typeof project.projectManager === 'string' ? null : project.projectManager)
    : null;

  return (
    <div className="space-y-4">
      {/* Project Manager */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Project Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projectManager ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={projectManager.profilePhoto} />
                  <AvatarFallback className="text-xs">
                    {projectManager.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-medium">{projectManager.name}</div>
                  <div className="text-xs text-muted-foreground">{projectManager.email}</div>
                </div>
              </div>
              {canManage && (
                <Button variant="ghost" size="sm" onClick={onAssignManager}>
                  Change
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">No manager assigned</span>
              {canManage && (
                <Button variant="outline" size="sm" onClick={onAssignManager}>
                  <Plus className="h-4 w-4 mr-1" />
                  Assign
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Maintainers */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Maintainers ({(project.maintainers || []).length})
            </CardTitle>
            {canManage && (
              <Button variant="ghost" size="sm" onClick={onAssignMaintainer}>
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {(project.maintainers || []).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {(project.maintainers || []).map((maintainer) => {
                const user = typeof maintainer === 'string' ? null : maintainer;
                if (!user) return null;

                return (
                  <Badge key={user._id} variant="secondary" className="pl-1 pr-2 py-1">
                    <Avatar className="h-5 w-5 mr-1">
                      <AvatarImage src={user.profilePhoto} />
                      <AvatarFallback className="text-[10px]">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {user.name}
                    {canManage && (
                      <button
                        className="ml-1 hover:text-destructive"
                        onClick={() => onRemoveMaintainer?.(user._id)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                );
              })}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">No maintainers assigned</span>
          )}
        </CardContent>
      </Card>

      {/* Assigned Teams */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Assigned Teams ({(project.assignedTeams || []).length})
            </CardTitle>
            {canManage && (
              <Button variant="ghost" size="sm" onClick={onAssignTeam}>
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {(project.assignedTeams || []).length > 0 ? (
            <div className="space-y-2">
              {(project.assignedTeams || []).map((team) => {
                const teamData = typeof team === 'string' ? null : team;
                if (!teamData) return null;

                return (
                  <div
                    key={teamData._id}
                    className="flex items-center justify-between p-2 rounded border"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{teamData.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {(teamData.members || []).length} members
                      </Badge>
                    </div>
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onRemoveTeam?.(teamData._id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">No teams assigned</span>
          )}
        </CardContent>
      </Card>

      {/* Assigned Individuals */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              Assigned Individuals ({(project.assignedIndividuals || []).length})
            </CardTitle>
            {canManage && (
              <Button variant="ghost" size="sm" onClick={onAssignIndividual}>
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {(project.assignedIndividuals || []).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {(project.assignedIndividuals || []).map((individual) => {
                const user = typeof individual === 'string' ? null : individual;
                if (!user) return null;

                return (
                  <Badge key={user._id} variant="outline" className="pl-1 pr-2 py-1">
                    <Avatar className="h-5 w-5 mr-1">
                      <AvatarImage src={user.profilePhoto} />
                      <AvatarFallback className="text-[10px]">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {user.name}
                    {canManage && (
                      <button
                        className="ml-1 hover:text-destructive"
                        onClick={() => onRemoveIndividual?.(user._id)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                );
              })}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">No individuals assigned</span>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
