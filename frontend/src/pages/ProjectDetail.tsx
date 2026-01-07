import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
    TaskType,
    UpdateWorkshopProjectData,
    CreateWorkshopTaskData
} from '@/types/workshop';
import api from '@/services/api';
import { useWorkshop } from '@/hooks/useWorkshops';
import { useWorkshopProject } from '@/hooks/useWorkshopProjects';
import { useWorkshopTasks } from '@/hooks/useWorkshopTasks';
import { useMemberships } from '@/hooks/useMembership';
import { useTeams } from '@/hooks/useTeams';
import { usePermissions } from '@/hooks/usePermission';
import { useWorkshopRoom, useProjectRoom } from '@/hooks/useSocket';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProjectAssignmentPanel, WorkshopTaskCard } from '@/components/workshop';
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
import { ArrowLeft, MoreVertical, Edit, Trash2, Plus, LayoutGrid, CheckSquare, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const ProjectDetail: React.FC = () => {
    const { workshopId, projectId } = useParams<{ workshopId: string; projectId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { workshop } = useWorkshop(workshopId);
    const { project, loading: projectLoading, setProject } = useWorkshopProject(workshopId, projectId);
    const { tasks, loading: tasksLoading, addTask } = useWorkshopTasks(workshopId, projectId);
    const { activeMembers } = useMemberships(workshopId);
    const { teams } = useTeams(workshopId);
    const { toast } = useToast();

    // Dialog states
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
    const [showAssignTeamDialog, setShowAssignTeamDialog] = useState(false);
    const [showAssignIndividualDialog, setShowAssignIndividualDialog] = useState(false);

    // Form states
    const [editData, setEditData] = useState<UpdateWorkshopProjectData>({});
    const [newTaskData, setNewTaskData] = useState<CreateWorkshopTaskData>({
        title: '',
        description: '',
        type: TaskType.FEATURE,
        priority: 2,
        severity: 1,
        primaryOwner: user?._id || '',
        contributors: [],
        watchers: [],
        assignedIndividuals: [],
        assignedTeams: [],
        estimatedHours: 0
    });
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Join rooms for real-time updates
    useWorkshopRoom(workshopId);
    useProjectRoom(projectId);

    // Load Permissions reactively
    const { permissions: permsMap } = usePermissions(workshopId, [
        { action: 'update', resource: 'project' },
        { action: 'delete', resource: 'project' },
        { action: 'create', resource: 'task' },
        { action: 'manage', resource: 'project' }
    ], { projectId });

    const permissions = {
        canUpdate: permsMap['update:project'] ?? false,
        canDelete: permsMap['delete:project'] ?? false,
        canCreateTask: permsMap['create:task'] ?? false,
        canManage: permsMap['manage:project'] ?? false
    };

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
    const isProjectManager = project && user && project.projectManager && (
        typeof project.projectManager === 'string'
            ? project.projectManager === user._id
            : project.projectManager._id === user._id
    );

    const canManage = isOwner || isManager || isProjectManager || permissions.canManage || permissions.canUpdate;

    // Handlers
    const handleEdit = () => {
        if (project) {
            setEditData({
                name: project.name,
                description: project.description
            });
            setShowEditDialog(true);
        }
    };

    const handleSaveEdit = async () => {
        if (!workshopId || !projectId) return;
        setSubmitting(true);
        try {
            const response = await api.updateWorkshopProject(workshopId, projectId, editData);
            setProject(response.data);
            setShowEditDialog(false);
            toast({ title: 'Project updated' });
        } catch (error: any) {
            toast({ title: 'Error', description: error.response?.data?.message, variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!workshopId || !projectId) return;
        setSubmitting(true);
        try {
            await api.deleteWorkshopProject(workshopId, projectId);
            toast({ title: 'Project deleted' });
            navigate(`/workshops/${workshopId}`);
        } catch (error: any) {
            toast({ title: 'Error', description: error.response?.data?.message, variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateTask = async () => {
        if (!workshopId || !projectId || !newTaskData.title) return;
        setSubmitting(true);
        try {
            const response = await api.createWorkshopTask(workshopId, projectId, newTaskData);
            addTask(response.data);
            setNewTaskData({
                title: '',
                description: '',
                type: TaskType.FEATURE,
                priority: 2,
                severity: 1,
                primaryOwner: user?._id || '',
                estimatedHours: 0,
                contributors: [],
                watchers: [],
                assignedIndividuals: [],
                assignedTeams: []
            });
            setShowNewTaskDialog(false);
            toast({ title: 'Task created' });
        } catch (error: any) {
            toast({ title: 'Error', description: error.response?.data?.message, variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleAssignTeam = async () => {
        if (!workshopId || !projectId || !selectedTeamId) return;
        setSubmitting(true);
        try {
            const response = await api.assignTeamToProject(workshopId, projectId, selectedTeamId);
            setProject(response.data);
            setSelectedTeamId('');
            setShowAssignTeamDialog(false);
            toast({ title: 'Team assigned' });
        } catch (error: any) {
            toast({ title: 'Error', description: error.response?.data?.message, variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemoveTeam = async (teamId: string) => {
        if (!workshopId || !projectId) return;
        try {
            const response = await api.removeTeamFromProject(workshopId, projectId, teamId);
            setProject(response.data);
            toast({ title: 'Team removed' });
        } catch (error: any) {
            toast({ title: 'Error', description: error.response?.data?.message, variant: 'destructive' });
        }
    };

    const handleAssignIndividual = async () => {
        if (!workshopId || !projectId || !selectedUserId) return;
        setSubmitting(true);
        try {
            const response = await api.assignIndividualToProject(workshopId, projectId, selectedUserId);
            setProject(response.data);
            setSelectedUserId('');
            setShowAssignIndividualDialog(false);
            toast({ title: 'Individual assigned' });
        } catch (error: any) {
            toast({ title: 'Error', description: error.response?.data?.message, variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemoveIndividual = async (userId: string) => {
        if (!workshopId || !projectId) return;
        try {
            const response = await api.removeIndividualFromProject(workshopId, projectId, userId);
            setProject(response.data);
            toast({ title: 'Individual removed' });
        } catch (error: any) {
            toast({ title: 'Error', description: error.response?.data?.message, variant: 'destructive' });
        }
    };

    if (projectLoading) {
        return (
            <AppLayout>
                <div className="page-container space-y-6">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </AppLayout>
        );
    }

    if (!project) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center py-16">
                    <h2 className="text-xl font-semibold mb-2">Project not found</h2>
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
                                <LayoutGrid className="h-6 w-6 text-primary" />
                                {project.name}
                            </h1>
                            <p className="text-muted-foreground">{project.description}</p>
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
                                {permissions.canUpdate && (
                                    <DropdownMenuItem onClick={handleEdit}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Project
                                    </DropdownMenuItem>
                                )}
                                {permissions.canDelete && (
                                    <DropdownMenuItem
                                        onClick={() => setShowDeleteDialog(true)}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Project
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                <div className="grid gap-6 lg:grid-cols-4">
                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-6">
                        <Tabs defaultValue="tasks" className="space-y-4">
                            <TabsList>
                                <TabsTrigger value="tasks" className="gap-2">
                                    <CheckSquare className="h-4 w-4" />
                                    Tasks
                                </TabsTrigger>
                                <TabsTrigger value="activity" className="gap-2">
                                    <Shield className="h-4 w-4" />
                                    Activity
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="tasks" className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-semibold">Tasks ({tasks.length})</h2>
                                    {permissions.canCreateTask && (
                                        <Button size="sm" onClick={() => setShowNewTaskDialog(true)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            New Task
                                        </Button>
                                    )}
                                </div>

                                {tasksLoading ? (
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40" />)}
                                    </div>
                                ) : tasks.length === 0 ? (
                                    <Card>
                                        <CardContent className="flex flex-col items-center py-12">
                                            <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
                                            <p className="text-muted-foreground">No tasks yet</p>
                                            <Button variant="outline" className="mt-4" onClick={() => setShowNewTaskDialog(true)}>
                                                Create your first task
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {tasks.map(task => (
                                            <WorkshopTaskCard
                                                key={task._id}
                                                task={task}
                                                onClick={() => navigate(`/workshops/${workshopId}/projects/${projectId}/tasks/${task._id}`)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="activity">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Project Activity</CardTitle>
                                        <CardDescription>Recent changes and updates in this project</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">Activity history coming soon...</p>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <ProjectAssignmentPanel
                            project={project}
                            canManage={canManage || false}
                            onAssignTeam={() => setShowAssignTeamDialog(true)}
                            onRemoveTeam={handleRemoveTeam}
                            onAssignIndividual={() => setShowAssignIndividualDialog(true)}
                            onRemoveIndividual={handleRemoveIndividual}
                        />
                    </div>
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Project</DialogTitle>
                        <DialogDescription>Update the name and description of this project.</DialogDescription>
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

            {/* New Task Dialog */}
            <Dialog open={showNewTaskDialog} onOpenChange={setShowNewTaskDialog}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Create New Task</DialogTitle>
                        <DialogDescription>Define the scope and assignment for this new task.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input
                                    value={newTaskData.title}
                                    onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                                    placeholder="What needs to be done?"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={newTaskData.description || ''}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewTaskData({ ...newTaskData, description: e.target.value })}
                                    placeholder="Add more context..."
                                    rows={4}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Primary Owner</Label>
                                <Select
                                    value={newTaskData.primaryOwner as string}
                                    onValueChange={(v) => setNewTaskData({ ...newTaskData, primaryOwner: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Assign a lead" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {activeMembers.map(m => {
                                            const memberUser = typeof m.user === 'string' ? null : m.user;
                                            if (!memberUser) return null;
                                            return (
                                                <SelectItem key={memberUser._id} value={memberUser._id}>
                                                    {memberUser.name}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select
                                        value={newTaskData.type}
                                        onValueChange={(v: TaskType) => setNewTaskData({ ...newTaskData, type: v })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={TaskType.BUG}>Bug</SelectItem>
                                            <SelectItem value={TaskType.FEATURE}>Feature</SelectItem>
                                            <SelectItem value={TaskType.ENHANCEMENT}>Enhancement</SelectItem>
                                            <SelectItem value={TaskType.DISCUSSION}>Discussion</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Priority</Label>
                                    <Select
                                        value={newTaskData.priority?.toString()}
                                        onValueChange={(v) => setNewTaskData({ ...newTaskData, priority: parseInt(v) })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Low</SelectItem>
                                            <SelectItem value="2">Medium</SelectItem>
                                            <SelectItem value="3">High</SelectItem>
                                            <SelectItem value="4">Urgent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Estimated Hours</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={newTaskData.estimatedHours || 0}
                                    onChange={(e) => setNewTaskData({ ...newTaskData, estimatedHours: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Due Date</Label>
                                <Input
                                    type="date"
                                    value={newTaskData.dueDate as any}
                                    onChange={(e) => setNewTaskData({ ...newTaskData, dueDate: e.target.value as any })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowNewTaskDialog(false)}>Cancel</Button>
                        <Button onClick={handleCreateTask} disabled={submitting || !newTaskData.title}>
                            {submitting ? 'Creating...' : 'Create Task'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assign Team Dialog */}
            <Dialog open={showAssignTeamDialog} onOpenChange={setShowAssignTeamDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Team</DialogTitle>
                        <DialogDescription>Select a team to assign to this project</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Team</Label>
                            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a team" />
                                </SelectTrigger>
                                <SelectContent>
                                    {teams.filter(t => !(project.assignedTeams || []).some(at => (typeof at === 'string' ? at : at._id) === t._id)).map(team => (
                                        <SelectItem key={team._id} value={team._id}>
                                            {team.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAssignTeamDialog(false)}>Cancel</Button>
                        <Button onClick={handleAssignTeam} disabled={submitting || !selectedTeamId}>
                            {submitting ? 'Assign' : 'Assign Team'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assign Individual Dialog */}
            <Dialog open={showAssignIndividualDialog} onOpenChange={setShowAssignIndividualDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Individual</DialogTitle>
                        <DialogDescription>Select a member to assign to this project</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Member</Label>
                            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a member" />
                                </SelectTrigger>
                                <SelectContent>
                                    {activeMembers
                                        .filter(m => {
                                            const userId = typeof m.user === 'string' ? m.user : m.user._id;
                                            return !(project.assignedIndividuals || []).some(ai => (typeof ai === 'string' ? ai : ai._id) === userId);
                                        })
                                        .map(m => {
                                            const memberUser = typeof m.user === 'string' ? null : m.user;
                                            if (!memberUser) return null;
                                            return (
                                                <SelectItem key={memberUser._id} value={memberUser._id}>
                                                    {memberUser.name}
                                                </SelectItem>
                                            );
                                        })}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAssignIndividualDialog(false)}>Cancel</Button>
                        <Button onClick={handleAssignIndividual} disabled={submitting || !selectedUserId}>
                            {submitting ? 'Assign' : 'Assign Individual'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. All tasks and data associated with this project will be lost.
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

export default ProjectDetail;
