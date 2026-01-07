import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { UpdateTeamData } from '@/types/workshop';
import api from '@/services/api';
import { useWorkshop } from '@/hooks/useWorkshops';
import { useTeam } from '@/hooks/useTeams';
import { useMemberships } from '@/hooks/useMembership';
import { AppLayout } from '@/components/layout/AppLayout';
import { TeamMemberList } from '@/components/workshop';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, MoreVertical, Edit, Trash2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const TeamDetail: React.FC = () => {
  const { workshopId, teamId } = useParams<{ workshopId: string; teamId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { workshop } = useWorkshop(workshopId);
  const { team, loading, setTeam } = useTeam(workshopId, teamId);
  const { activeMembers } = useMemberships(workshopId);
  const { toast } = useToast();

  // Dialog states
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);

  // Form states
  const [editData, setEditData] = useState<UpdateTeamData>({});
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Computed values
  const isOwner = workshop && user && (
    typeof workshop.owner === 'string' 
      ? workshop.owner === user._id 
      : workshop.owner._id === user._id
  );
  const isManager = workshop && user && workshop.managers.some(m => {
    const managerId = typeof m === 'string' ? m : m._id;
    return managerId === user._id;
  });
  const canManage = isOwner || isManager;

  // Get members not in team for add dialog
  const availableMembers = activeMembers.filter(membership => {
    const memberId = typeof membership.user === 'string' ? membership.user : membership.user._id;
    return !team?.members.some(m => {
      const teamMemberId = typeof m === 'string' ? m : m._id;
      return teamMemberId === memberId;
    });
  });

  // Handlers
  const handleEdit = () => {
    if (team) {
      setEditData({
        name: team.name,
        description: team.description
      });
      setShowEditDialog(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!workshopId || !teamId) return;
    setSubmitting(true);
    try {
      const response = await api.updateTeam(workshopId, teamId, editData);
      setTeam(response.data);
      setShowEditDialog(false);
      toast({ title: 'Team updated' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!workshopId || !teamId) return;
    setSubmitting(true);
    try {
      await api.deleteTeam(workshopId, teamId);
      toast({ title: 'Team deleted' });
      navigate(`/workshops/${workshopId}`);
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMember = async () => {
    if (!workshopId || !teamId || !selectedMemberId) return;
    setSubmitting(true);
    try {
      const response = await api.addTeamMember(workshopId, teamId, selectedMemberId);
      setTeam(response.data);
      setSelectedMemberId('');
      setShowAddMemberDialog(false);
      toast({ title: 'Member added' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!workshopId || !teamId) return;
    try {
      const response = await api.removeWorkshopTeamMember(workshopId, teamId, userId);
      setTeam(response.data);
      toast({ title: 'Member removed' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message, variant: 'destructive' });
    }
  };

  const handleAssignRole = async (userId: string, roleName: string) => {
    if (!workshopId || !teamId) return;
    try {
      const response = await api.assignTeamInternalRole(workshopId, teamId, userId, roleName);
      setTeam(response.data);
      toast({ title: 'Role assigned' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message, variant: 'destructive' });
    }
  };

  const handleRemoveRole = async (userId: string, roleName: string) => {
    if (!workshopId || !teamId) return;
    try {
      const response = await api.removeTeamInternalRole(workshopId, teamId, userId, roleName);
      setTeam(response.data);
      toast({ title: 'Role removed' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message, variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="page-container space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!team) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-16">
          <h2 className="text-xl font-semibold mb-2">Team not found</h2>
          <Button onClick={() => navigate(`/workshops/${workshopId}`)}>Back to Workshop</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-container space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/workshops/${workshopId}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6" />
                {team.name}
              </h1>
              {team.description && (
                <p className="text-muted-foreground">{team.description}</p>
              )}
            </div>
          </div>
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Team
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Team
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members ({team.members.length})</CardTitle>
            <CardDescription>Manage team members and their internal roles</CardDescription>
          </CardHeader>
          <CardContent>
            <TeamMemberList
              team={team}
              canManage={canManage || false}
              onAddMember={() => setShowAddMemberDialog(true)}
              onRemoveMember={handleRemoveMember}
              onAssignRole={handleAssignRole}
              onRemoveRole={handleRemoveRole}
            />
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>Select a workshop member to add to this team</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Member</Label>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a member" />
                </SelectTrigger>
                <SelectContent>
                  {availableMembers.map(membership => {
                    const memberUser = typeof membership.user === 'string' ? null : membership.user;
                    if (!memberUser) return null;
                    return (
                      <SelectItem key={memberUser._id} value={memberUser._id}>
                        {memberUser.name} ({memberUser.email})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {availableMembers.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  All workshop members are already in this team
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>Cancel</Button>
            <Button onClick={handleAddMember} disabled={submitting || !selectedMemberId}>
              {submitting ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The team will be permanently deleted.
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

export default TeamDetail;
