import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  UpdateWorkshopData,
  CreateTeamData,
  CreateWorkshopProjectData,
  WorkshopVisibility
} from '@/types/workshop';
import api from '@/services/api';
import { useWorkshop } from '@/hooks/useWorkshops';
import { useMemberships } from '@/hooks/useMembership';
import { useTeams } from '@/hooks/useTeams';
import { useWorkshopProjects } from '@/hooks/useWorkshopProjects';
import { useRoles } from '@/hooks/useRoles';
import { ProjectCategory, PROJECT_CATEGORY_LABELS } from '@/types';
import { AppLayout } from '@/components/layout/AppLayout';
import { WorkshopHeader, MemberList, TeamCard, RoleManager } from '@/components/workshop';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, FolderKanban, Users, Shield, Inbox, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermission';
import { useWorkshopRoom } from '@/hooks/useSocket';
import { Link } from 'react-router-dom';

const WorkshopDashboard: React.FC = () => {
  const { workshopId } = useParams<{ workshopId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { workshop, loading: workshopLoading, setWorkshop } = useWorkshop(workshopId);
  const { pendingRequests, activeMembers, loading: membersLoading, refetch: refetchMembers } = useMemberships(workshopId);
  const { teams, loading: teamsLoading, addTeam } = useTeams(workshopId);
  const { projects, loading: projectsLoading, addProject } = useWorkshopProjects(workshopId);
  const { roles, loading: rolesLoading } = useRoles(workshopId);

  useWorkshopRoom(workshopId);

  const { permissions: permsMap } = usePermissions(workshopId, [
    { action: 'create', resource: 'project' },
    { action: 'create', resource: 'team' },
    { action: 'invite', resource: 'membership' },
    { action: 'manage', resource: 'role' },
    { action: 'update', resource: 'workshop' }
  ]);

  const permissions = {
    canCreateProject: permsMap['create:project'] ?? false,
    canCreateTeam: permsMap['create:team'] ?? false,
    canInvite: permsMap['invite:membership'] ?? false,
    canManageRoles: permsMap['manage:role'] ?? false,
    canEditWorkshop: permsMap['update:workshop'] ?? false
  };

  const { toast } = useToast();

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showNewTeamDialog, setShowNewTeamDialog] = useState(false);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);

  const [editData, setEditData] = useState<UpdateWorkshopData>({});
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedInviteRoleId, setSelectedInviteRoleId] = useState<string | undefined>(undefined);
  const [newTeam, setNewTeam] = useState<CreateTeamData>({ name: '', description: '' });
  const [newProject, setNewProject] = useState<CreateWorkshopProjectData>({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const isOwner = workshop && user && (
    typeof workshop.owner === 'string'
      ? workshop.owner === user._id
      : workshop.owner._id === user._id
  );
  const isManager = workshop && user && workshop.managers.some(m => {
    const managerId = typeof m === 'string' ? m : m._id;
    return managerId === user._id;
  });

  const canManage = isOwner || isManager || permissions.canEditWorkshop || permissions.canManageRoles || permissions.canInvite;

  const isActiveMember = activeMembers.some(m => {
    const memberId = typeof m.user === 'string' ? m.user : m.user._id;
    return memberId === user?._id;
  });
  const isPendingMember = pendingRequests.some(m => {
    const memberId = typeof m.user === 'string' ? m.user : m.user._id;
    return memberId === user?._id;
  });
  const isMember = isOwner || isManager || isActiveMember;

  const handleEdit = () => {
    if (workshop) {
      setEditData({
        name: workshop.name,
        description: workshop.description,
        visibility: workshop.visibility,
        category: workshop.category
      });
      setShowEditDialog(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!workshopId) return;
    setSubmitting(true);
    try {
      const response = await api.updateWorkshop(workshopId, editData);
      setWorkshop(response.data);
      setShowEditDialog(false);
      toast({ title: 'Workshop updated' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to update', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInvite = async () => {
    if (!workshopId || !inviteEmail) return;
    setSubmitting(true);
    try {
      await api.inviteWorkshopMember(workshopId, inviteEmail, selectedInviteRoleId);
      setInviteEmail('');
      setSelectedInviteRoleId(undefined);
      setShowInviteDialog(false);
      refetchMembers();
      toast({ title: 'Invitation sent' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to invite', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!workshopId) return;
    setSubmitting(true);
    try {
      await api.deleteWorkshop(workshopId);
      toast({ title: 'Workshop deleted' });
      navigate('/workshops');
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to delete', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveJoinRequest = async (membershipId: string) => {
    if (!workshopId) return;
    try {
      await api.respondToWorkshopJoinRequest(workshopId, membershipId, 'approved');
      refetchMembers();
      toast({ title: 'Request approved' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message, variant: 'destructive' });
    }
  };

  const handleRejectJoinRequest = async (membershipId: string) => {
    if (!workshopId) return;
    try {
      await api.respondToWorkshopJoinRequest(workshopId, membershipId, 'rejected');
      refetchMembers();
      toast({ title: 'Request rejected' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message, variant: 'destructive' });
    }
  };

  const handleJoin = async () => {
    if (!workshopId) return;
    setSubmitting(true);
    try {
      await api.requestToJoinWorkshop(workshopId);
      refetchMembers();
      toast({
        title: isPendingMember ? 'Welcome!' : 'Request Sent',
        description: isPendingMember ? 'You have joined the workshop.' : 'Your request to join is pending approval.'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to join',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeMembership = async (userId: string) => {
    if (!workshopId) return;
    try {
      await api.revokeWorkshopMembership(workshopId, userId);
      refetchMembers();
      toast({ title: 'Member removed' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message, variant: 'destructive' });
    }
  };

  const handleCreateTeam = async () => {
    if (!workshopId || !newTeam.name) return;
    setSubmitting(true);
    try {
      const response = await api.createTeam(workshopId, newTeam);
      addTeam(response.data);
      setNewTeam({ name: '', description: '' });
      setShowNewTeamDialog(false);
      toast({ title: 'Team created' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateProject = async () => {
    if (!workshopId || !newProject.name) return;
    setSubmitting(true);
    try {
      const response = await api.createWorkshopProject(workshopId, newProject);
      addProject(response.data);
      setNewProject({ name: '', description: '' });
      setShowNewProjectDialog(false);
      toast({ title: 'Project created' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignRole = async (userId: string, roleId: string) => {
    if (!workshopId) return;
    try {
      await api.assignRole(workshopId, roleId, userId);
      toast({ title: 'Role assigned successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to assign role', variant: 'destructive' });
    }
  };

  const handleRemoveRole = async (userId: string, roleId: string) => {
    if (!workshopId) return;
    try {
      await api.revokeRole(workshopId, roleId, userId);
      toast({ title: 'Role removed successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to remove role', variant: 'destructive' });
    }
  };

  if (workshopLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!workshop) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-16">
          <h2 className="text-xl font-semibold mb-2">Workshop not found</h2>
          <Button onClick={() => navigate('/workshops')}>Back to Workshops</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 px-4 sm:px-6 lg:px-8">
        <WorkshopHeader
          workshop={workshop}
          isOwner={isOwner || false}
          isManager={isManager || false}
          isMember={isMember || false}
          isPending={isPendingMember}
          onEdit={handleEdit}
          onInvite={() => setShowInviteDialog(true)}
          onSettings={() => { }}
          onDelete={() => setShowDeleteDialog(true)}
          onJoin={handleJoin}
          submitting={submitting}
        />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          {!isMember && workshop.visibility === WorkshopVisibility.PRIVATE ? (
            <Card className="mt-8">
              <CardContent className="flex flex-col items-center py-16 text-center">
                <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">Private Workshop</h2>
                <p className="text-muted-foreground mb-8 max-w-md">
                  This workshop is private. You need to be a member to view its projects, teams, and discussions.
                </p>
                <Button onClick={handleJoin} disabled={submitting} size="lg">
                  {isPendingMember ? 'Accept Invitation' : 'Request to Join'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="projects" className="space-y-6">
              <TabsList>
                <TabsTrigger value="projects" className="gap-2">
                  <FolderKanban className="h-4 w-4" />
                  Projects
                </TabsTrigger>
                <TabsTrigger value="teams" className="gap-2">
                  <Users className="h-4 w-4" />
                  Teams
                </TabsTrigger>
                <TabsTrigger value="members" className="gap-2">
                  <Users className="h-4 w-4" />
                  Members
                  {pendingRequests.length > 0 && canManage && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                      {pendingRequests.length}
                    </span>
                  )}
                </TabsTrigger>
                {canManage && (
                  <TabsTrigger value="roles" className="gap-2">
                    <Shield className="h-4 w-4" />
                    Roles
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="projects" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Projects ({projects.length})</h2>
                  {permissions.canCreateProject && (
                    <Button size="sm" onClick={() => setShowNewProjectDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Project
                    </Button>
                  )}
                </div>
                {projectsLoading ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-40" />)}
                  </div>
                ) : projects.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center py-12">
                      <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No projects yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {projects.map(project => (
                      <Link key={project._id} to={`/workshops/${workshopId}/projects/${project._id}`}>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                          <CardHeader>
                            <CardTitle className="text-lg">{project.name}</CardTitle>
                            <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex gap-4 text-sm text-muted-foreground">
                              <span>{project.assignedTeams.length} teams</span>
                              <span>{project.assignedIndividuals.length} individuals</span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="teams" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Teams ({teams.length})</h2>
                  {permissions.canCreateTeam && (
                    <Button size="sm" onClick={() => setShowNewTeamDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Team
                    </Button>
                  )}
                </div>
                {teamsLoading ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-40" />)}
                  </div>
                ) : teams.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center py-12">
                      <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No teams yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {teams.map(team => (
                      <TeamCard
                        key={team._id}
                        team={team}
                        workshopId={workshopId!}
                        onClick={() => navigate(`/workshops/${workshopId}/teams/${team._id}`)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="members" className="space-y-4">
                {pendingRequests.length > 0 && canManage && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Pending Requests ({pendingRequests.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <MemberList
                        members={pendingRequests}
                        roles={roles}
                        canManage={canManage || false}
                        currentUserId={user?._id}
                        workshopOwnerId={typeof workshop?.owner === 'string' ? workshop.owner : workshop?.owner?._id}
                        onApprove={handleApproveJoinRequest}
                        onReject={handleRejectJoinRequest}
                        onAssignRole={handleAssignRole}
                        onRemoveRole={handleRemoveRole}
                      />
                    </CardContent>
                  </Card>
                )}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Active Members ({activeMembers.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {membersLoading ? (
                      <Skeleton className="h-40" />
                    ) : (
                      <MemberList
                        members={activeMembers}
                        roles={roles}
                        canManage={canManage || false}
                        currentUserId={user?._id}
                        workshopOwnerId={typeof workshop?.owner === 'string' ? workshop.owner : workshop?.owner?._id}
                        onRevoke={handleRevokeMembership}
                        onAssignRole={handleAssignRole}
                        onRemoveRole={handleRemoveRole}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {canManage && (
                <TabsContent value="roles" className="space-y-4">
                  {rolesLoading ? (
                    <Skeleton className="h-40" />
                  ) : (
                    <RoleManager
                      roles={roles}
                      canManage={canManage || false}
                      onCreateRole={async (data) => {
                        if (!workshopId) return;
                        try {
                          await api.createRole(workshopId, { ...data, scope: 'workshop' as any });
                          toast({ title: 'Role created' });
                        } catch (error: any) {
                          toast({ title: 'Error', description: error.response?.data?.message, variant: 'destructive' });
                        }
                      }}
                      onDeleteRole={async (roleId) => {
                        if (!workshopId) return;
                        try {
                          await api.deleteRole(workshopId, roleId);
                          toast({ title: 'Role deleted' });
                        } catch (error: any) {
                          toast({ title: 'Error', description: error.response?.data?.message, variant: 'destructive' });
                        }
                      }}
                      onEditRole={async (roleId, data) => {
                        if (!workshopId) return;
                        try {
                          await api.updateRole(workshopId, roleId, data);
                          toast({ title: 'Role updated' });
                        } catch (error: any) {
                          toast({ title: 'Error', description: error.response?.data?.message, variant: 'destructive' });
                        }
                      }}
                    />
                  )}
                </TabsContent>
              )}
            </Tabs>
          )}
        </div>
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Workshop</DialogTitle>
            <DialogDescription>Update the details and settings of your workshop.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editData.name || ''}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditData({ ...editData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={editData.category}
                onValueChange={(v: ProjectCategory) => setEditData({ ...editData, category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROJECT_CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select
                value={editData.visibility}
                onValueChange={(v: WorkshopVisibility) => setEditData({ ...editData, visibility: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={WorkshopVisibility.PRIVATE}>Private</SelectItem>
                  <SelectItem value={WorkshopVisibility.PUBLIC}>Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
            <DialogDescription>Send an invitation to join this workshop</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            {roles.length > 0 && (
              <div className="space-y-2">
                <Label>Initial Role (Optional)</Label>
                <Select value={selectedInviteRoleId} onValueChange={setSelectedInviteRoleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role._id} value={role._id}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={submitting || !inviteEmail}>
              {submitting ? 'Sending...' : 'Send Invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewTeamDialog} onOpenChange={setShowNewTeamDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Team</DialogTitle>
            <DialogDescription>Add a new team to collaborate on projects.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Team Name</Label>
              <Input
                value={newTeam.name}
                onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                placeholder="e.g., Frontend Team"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newTeam.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewTeam({ ...newTeam, description: e.target.value })}
                placeholder="What does this team do?"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTeamDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateTeam} disabled={submitting || !newTeam.name}>
              {submitting ? 'Creating...' : 'Create Team'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>Start a new project within this workshop.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="e.g., Mobile App"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newProject.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="What is this project about?"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewProjectDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateProject} disabled={submitting || !newProject.name}>
              {submitting ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workshop?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All projects, teams, and data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {submitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default WorkshopDashboard;