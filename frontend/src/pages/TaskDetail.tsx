import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { TaskType, TASK_TYPE_LABELS, UpdateWorkshopTaskData, TaskComment, TaskAttachment } from '@/types/workshop';
import api from '@/services/api';
import { useWorkshop } from '@/hooks/useWorkshops';
import { useWorkshopProject } from '@/hooks/useWorkshopProjects';
import { useWorkshopTask, useTaskActivity } from '@/hooks/useWorkshopTasks';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMemberships } from '@/hooks/useMembership';
import { useTeams } from '@/hooks/useTeams';
import { useWorkshopTasks } from '@/hooks/useWorkshopTasks';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    ArrowLeft,
    MoreVertical,
    Edit,
    Trash2,
    CheckSquare,
    Clock,
    History,
    User as UserIcon,
    Users,
    Bug,
    Lightbulb,
    Sparkles,
    MessageSquare,
    Calendar,
    ChevronRight,
    Paperclip,
    Send,
    Shield,
    AlertCircle,
    CheckCircle2,
    Lock,
    Unlock,
    Activity,
    Plus,
    FileText,
    Download,
    ExternalLink,
    Check,
    Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { Progress } from '@/components/ui/progress';

const TaskDetail: React.FC = () => {
    const { workshopId, projectId, taskId } = useParams<{
        workshopId: string;
        projectId: string;
        taskId: string
    }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { workshop } = useWorkshop(workshopId);
    const { project } = useWorkshopProject(workshopId, projectId);
    const { task, loading: taskLoading, setTask, refresh: refreshTask } = useWorkshopTask(workshopId, projectId, taskId);
    const { activities, loading: activitiesLoading } = useTaskActivity(workshopId, projectId, taskId);
    const { activeMembers } = useMemberships(workshopId);
    const { teams } = useTeams(workshopId);
    const { tasks: allTasks } = useWorkshopTasks(workshopId, projectId);
    const { toast } = useToast();

    // UI States
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [activeTab, setActiveTab] = useState('discussion');
    const [newComment, setNewComment] = useState('');
    const [attachmentLoading, setAttachmentLoading] = useState(false);

    // Form states
    const [editData, setEditData] = useState<UpdateWorkshopTaskData>({});
    const [submitting, setSubmitting] = useState(false);

    // Permissions
    const isOwner = workshop && user && (
        typeof workshop.owner === 'string'
            ? workshop.owner === user._id
            : workshop.owner._id === user._id
    );
    const isManager = workshop && user && workshop.managers.some(m => {
        const managerId = typeof m === 'string' ? m : m._id;
        return managerId === user._id;
    });
    const isProjectManager = project && user && (
        typeof project.projectManager === 'string'
            ? project.projectManager === user._id
            : project.projectManager?._id === user._id
    );
    const canManage = isOwner || isManager || isProjectManager;

    const getTypeIcon = (type: TaskType) => {
        switch (type) {
            case TaskType.BUG: return <Bug className="h-4 w-4" />;
            case TaskType.FEATURE: return <Lightbulb className="h-4 w-4" />;
            case TaskType.ENHANCEMENT: return <Sparkles className="h-4 w-4" />;
            case TaskType.DISCUSSION: return <MessageSquare className="h-4 w-4" />;
            default: return <CheckSquare className="h-4 w-4" />;
        }
    };

    const toggleArrayItem = (field: keyof UpdateWorkshopTaskData, item: string) => {
        const current = (editData[field] as string[]) || [];
        const updated = current.includes(item)
            ? current.filter(i => i !== item)
            : [...current, item];
        setEditData({ ...editData, [field]: updated });
    };

    const getPriorityColor = (priority: number) => {
        if (priority >= 4) return 'bg-red-100 text-red-700 border-red-200';
        if (priority >= 3) return 'bg-orange-100 text-orange-700 border-orange-200';
        if (priority >= 2) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        return 'bg-blue-100 text-blue-700 border-blue-200';
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'todo': return <Badge variant="outline" className="bg-slate-50">To Do</Badge>;
            case 'in_progress': return <Badge variant="default" className="bg-blue-600">In Progress</Badge>;
            case 'done': return <Badge variant="default" className="bg-green-600">Done</Badge>;
            case 'blocked': return <Badge variant="destructive">Blocked</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    // Handlers
    const handleEdit = () => {
        if (task) {
            setEditData({
                title: task.title,
                description: task.description,
                type: task.type,
                status: task.status,
                priority: task.priority,
                severity: task.severity,
                labels: task.labels || [],
                tags: task.tags || [],
                estimatedHours: task.estimatedHours || 0,
                startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
                dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
                primaryOwner: typeof task.primaryOwner === 'object' ? (task.primaryOwner as any)?._id : task.primaryOwner,
                contributors: task.contributors?.map((c: any) => typeof c === 'object' ? c._id : c) || [],
                watchers: task.watchers?.map((w: any) => typeof w === 'object' ? w._id : w) || [],
                blockedBy: task.blockedBy?.map((b: any) => typeof b === 'object' ? b._id : b) || [],
                blocking: task.blocking?.map((b: any) => typeof b === 'object' ? b._id : b) || [],
                parentTask: typeof task.parentTask === 'object' ? (task.parentTask as any)?._id : task.parentTask,
            } as any);
            setShowEditDialog(true);
        }
    };

    const handleSaveEdit = async () => {
        if (!workshopId || !projectId || !taskId) return;
        setSubmitting(true);
        try {
            const response = await api.updateWorkshopTask(workshopId, projectId, taskId, editData);
            setTask(response.data);
            setShowEditDialog(false);
            toast({ title: 'Task updated' });
        } catch (error: any) {
            toast({ title: 'Error', description: error.response?.data?.message, variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !workshopId || !projectId || !taskId) return;
        setSubmitting(true);
        try {
            // Parse mentions
            const mentions: string[] = [];
            const mentionMatches = newComment.match(/@(\w+)/g);
            if (mentionMatches && activeMembers) {
                mentionMatches.forEach(match => {
                    const name = match.substring(1); // remove @
                    const member = activeMembers.find(m => {
                        const mName = typeof m.user === 'string' ? '' : m.user.name;
                        // Simple case-insensitive match on full name or first name
                        return mName.toLowerCase().includes(name.toLowerCase());
                    });
                    if (member) {
                        const userId = typeof member.user === 'string' ? member.user : member.user._id;
                        mentions.push(userId);
                    }
                });
            }

            const response = await api.addWorkshopTaskComment(workshopId, projectId, taskId, newComment, mentions);
            // Updating task is handled by socket, but we set it here for immediate feedback
            setTask(response.data);
            setNewComment('');
            toast({ title: 'Comment added' });
        } catch (error: any) {
            toast({ title: 'Error', description: error.response?.data?.message, variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!workshopId || !projectId || !taskId) return;
        try {
            const response = await api.updateWorkshopTaskStatus(workshopId, projectId, taskId, newStatus);
            setTask(response.data);
            toast({ title: 'Status updated' });
        } catch (error: any) {
            toast({ title: 'Error', description: error.response?.data?.message, variant: 'destructive' });
        }
    };

    const handleDelete = async () => {
        if (!workshopId || !projectId || !taskId) return;
        setSubmitting(true);
        try {
            await api.deleteWorkshopTask(workshopId, projectId, taskId);
            toast({ title: 'Task deleted' });
            navigate(`/workshops/${workshopId}/projects/${projectId}`);
        } catch (error: any) {
            toast({ title: 'Error', description: error.response?.data?.message, variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !workshopId || !projectId || !taskId) return;

        setSubmitting(true);
        try {
            // 1. Upload file to storage
            const uploadResponse = await api.uploadFile(file);
            const { fileUrl, fileName, fileType, fileSize } = uploadResponse.data;

            // 2. Add attachment to task
            const taskResponse = await api.addWorkshopTaskAttachment(workshopId, projectId, taskId, {
                fileUrl,
                fileName,
                fileType,
                fileSize
            });

            setTask(taskResponse.data);
            toast({ title: 'Attachment added', description: `${fileName} uploaded successfully.` });
        } catch (error: any) {
            toast({
                title: 'Upload failed',
                description: error.response?.data?.message || 'Failed to upload attachment',
                variant: 'destructive'
            });
        } finally {
            setSubmitting(false);
            if (e.target) e.target.value = '';
        }
    };

    if (taskLoading) {
        return (
            <AppLayout>
                <div className="page-container space-y-6">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-64" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-3 space-y-6">
                            <Skeleton className="h-64 w-full" />
                            <Skeleton className="h-96 w-full" />
                        </div>
                        <div className="space-y-6">
                            <Skeleton className="h-48 w-full" />
                            <Skeleton className="h-48 w-full" />
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (!task) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center py-24">
                    <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Task Not Found</h2>
                    <p className="text-muted-foreground mb-6">The task you're looking for doesn't exist or has been deleted.</p>
                    <Button onClick={() => navigate(`/workshops/${workshopId}/projects/${projectId}`)}>
                        Return to Project
                    </Button>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="page-container max-w-7xl mx-auto space-y-6 pb-20">
                {/* Breadcrumbs / Back */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link to={`/workshops/${workshopId}`} className="hover:text-foreground transition-colors">Workshop</Link>
                    <ChevronRight className="h-4 w-4" />
                    <Link to={`/workshops/${workshopId}/projects/${projectId}`} className="hover:text-foreground transition-colors">{project?.name || 'Project'}</Link>
                    <ChevronRight className="h-4 w-4" />
                    <span className="text-foreground font-medium truncate">#{task._id.slice(-6)}</span>
                </div>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${getPriorityColor(task.priority)} flex items-center justify-center`}>
                            {getTypeIcon(task.type)}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                {getStatusBadge(task.status)}
                                <Badge variant="secondary" className="font-normal">
                                    {TASK_TYPE_LABELS[task.type]}
                                </Badge>
                                {task.parentTask && (
                                    <Link to={`/workshops/${workshopId}/projects/${projectId}/tasks/${typeof task.parentTask === 'string' ? task.parentTask : task.parentTask._id}`}>
                                        <Badge variant="outline" className="gap-1 hover:bg-slate-100 transition-colors">
                                            Subtask of #{typeof task.parentTask === 'string' ? task.parentTask.slice(-4) : (task.parentTask as any).title}
                                        </Badge>
                                    </Link>
                                )}
                            </div>
                            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                                {task.title}
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={task.status} onValueChange={handleStatusChange}>
                            <SelectTrigger className="w-[160px] h-10 shadow-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todo">To Do</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="done">Done</SelectItem>
                                <SelectItem value="blocked">Blocked</SelectItem>
                            </SelectContent>
                        </Select>

                        {canManage && (
                            <div className="flex gap-2">
                                <Button variant="outline" size="icon" onClick={handleEdit}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="icon">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive">
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Task
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Description */}
                        <section className="space-y-3">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                Description
                            </h3>
                            <Card className="border-none shadow-sm bg-slate-50/50">
                                <CardContent className="pt-6">
                                    {task.description ? (
                                        <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
                                            {task.description}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground italic bg-slate-100/30 rounded-lg">
                                            No detailed description provided.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </section>

                        {/* Hierarchy & Dependencies (if any) */}
                        {(task.childTasks?.length > 0 || task.blockedBy?.length > 0 || task.blocking?.length > 0) && (
                            <section className="grid md:grid-cols-2 gap-6">
                                {task.childTasks?.length > 0 && (
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium">Subtasks</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            {task.childTasks.map((ct: any) => (
                                                <Link
                                                    key={ct._id}
                                                    to={`/workshops/${workshopId}/projects/${projectId}/tasks/${ct._id}`}
                                                    className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-sm group"
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <CheckSquare className="h-4 w-4 text-slate-400 group-hover:text-blue-500" />
                                                        {ct.title}
                                                    </span>
                                                    {getStatusBadge(ct.status)}
                                                </Link>
                                            ))}
                                        </CardContent>
                                    </Card>
                                )}
                                {(task.blockedBy?.length > 0 || task.blocking?.length > 0) && (
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium">Relationships</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {task.blockedBy?.length > 0 && (
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-red-500">Blocked By</Label>
                                                    {task.blockedBy.map((b: any) => (
                                                        <div key={b._id} className="text-xs flex items-center gap-2 p-1.5 bg-red-50 rounded border border-red-100">
                                                            <Lock className="h-3 w-3 text-red-400" />
                                                            <span className="truncate">{b.title}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {task.blocking?.length > 0 && (
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-blue-500">Blocking</Label>
                                                    {task.blocking.map((b: any) => (
                                                        <div key={b._id} className="text-xs flex items-center gap-2 p-1.5 bg-blue-50 rounded border border-blue-100">
                                                            <Unlock className="h-3 w-3 text-blue-400" />
                                                            <span className="truncate">{b.title}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}
                            </section>
                        )}

                        {/* Engagement Tabs */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="bg-transparent border-b rounded-none px-0 h-12 w-full justify-start gap-8">
                                <TabsTrigger value="discussion" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-2 h-full gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    Discussion
                                    <Badge variant="secondary" className="ml-1 px-1.5 py-0 min-w-[20px] h-5 justify-center">
                                        {task.comments?.length || 0}
                                    </Badge>
                                </TabsTrigger>
                                <TabsTrigger value="attachments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-2 h-full gap-2">
                                    <Paperclip className="h-4 w-4" />
                                    Attachments
                                    <Badge variant="secondary" className="ml-1 px-1.5 py-0 min-w-[20px] h-5 justify-center">
                                        {task.attachments?.length || 0}
                                    </Badge>
                                </TabsTrigger>
                                <TabsTrigger value="activity" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-2 h-full gap-2">
                                    <Activity className="h-4 w-4" />
                                    Work History
                                </TabsTrigger>
                            </TabsList>

                            {/* Discussion Tab */}
                            <TabsContent value="discussion" className="pt-6 space-y-6">
                                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                    {task.comments?.length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground bg-slate-50 rounded-lg">
                                            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                            <p>No comments yet. Start the conversation!</p>
                                        </div>
                                    ) : (
                                        task.comments.map((comment, idx) => (
                                            <div key={comment._id || idx} className="flex gap-3">
                                                <Avatar className="h-8 w-8 mt-1">
                                                    <AvatarImage src={comment.user.profilePhoto} />
                                                    <AvatarFallback>
                                                        {comment.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold">{comment.user.name}</span>
                                                            <span className="text-[10px] text-muted-foreground">
                                                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                                            </span>
                                                        </div>
                                                        {comment.isEdited && <Badge variant="outline" className="text-[8px] h-3 px-1">Edited</Badge>}
                                                    </div>
                                                    <div className="p-3 bg-white border rounded-r-lg rounded-bl-lg text-sm shadow-sm">
                                                        {comment.content}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="flex gap-3 pt-4 border-t">
                                    <Avatar className="h-8 w-8 mt-1 shadow-sm">
                                        <AvatarImage src={user?.profilePhoto} />
                                        <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 relative">
                                        <Textarea
                                            placeholder="Add a comment... (use @ to mention)"
                                            className="min-h-[80px] bg-white shadow-sm resize-none pr-12 pt-3"
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                        />
                                        <Button
                                            size="icon"
                                            className="absolute bottom-3 right-3 h-8 w-8 rounded-full transition-all"
                                            onClick={handleAddComment}
                                            disabled={!newComment.trim() || submitting}
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Attachments Tab */}
                            <TabsContent value="attachments" className="pt-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <label className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-10 cursor-pointer hover:bg-slate-50 transition-colors group ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        <Plus className="h-8 w-8 text-slate-300 group-hover:text-blue-500 mb-2 transition-colors" />
                                        <span className="text-sm text-slate-500">{submitting ? 'Uploading...' : 'Upload File'}</span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                            disabled={submitting}
                                        />
                                    </label>
                                    {task.attachments?.map((file) => (
                                        <Card key={file._id} className="overflow-hidden group">
                                            <CardContent className="p-0">
                                                <div className="aspect-[4/3] bg-slate-100 flex items-center justify-center overflow-hidden">
                                                    {file.fileType.startsWith('image/') ? (
                                                        <img src={file.fileUrl} alt={file.fileName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    ) : (
                                                        <FileText className="h-12 w-12 text-slate-400" />
                                                    )}
                                                </div>
                                                <div className="p-3">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="text-xs font-bold truncate pr-2">{file.fileName}</p>
                                                        <a href={file.fileUrl} download target="_blank" rel="noreferrer">
                                                            <Download className="h-3 w-3 text-slate-400 hover:text-blue-500 transition-colors" />
                                                        </a>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] text-muted-foreground">{(file.fileSize / 1024).toFixed(1)} KB</span>
                                                        <span className="text-[10px] text-muted-foreground">{format(new Date(file.uploadedAt), 'MMM d')}</span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </TabsContent>

                            {/* Activity Tab */}
                            <TabsContent value="activity" className="pt-6">
                                <Card className="border-none shadow-none bg-slate-50/50">
                                    <CardContent className="pt-6">
                                        <div className="relative space-y-6 before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                                            {activitiesLoading ? (
                                                <div className="space-y-4 pl-10">
                                                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                                                </div>
                                            ) : (activities.length === 0 && task.statusHistory?.length === 0) ? (
                                                <div className="text-center py-10 opacity-50 italic">No history available</div>
                                            ) : (
                                                <div className="space-y-8 pl-10">
                                                    {/* Status Changes First (High importance) */}
                                                    {task.statusHistory?.map((history, idx) => (
                                                        <div key={history._id || idx} className="relative">
                                                            <div className="absolute -left-[30px] w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow-sm" />
                                                            <div className="space-y-1">
                                                                <div className="text-sm font-semibold flex items-center gap-2">
                                                                    Status moved to {getStatusBadge(history.status)}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground flex items-center gap-4">
                                                                    <span className="flex items-center gap-1">
                                                                        <UserIcon className="h-3 w-3" />
                                                                        {history.changedBy?.name}
                                                                    </span>
                                                                    <span className="flex items-center gap-1">
                                                                        <Calendar className="h-3 w-3" />
                                                                        {format(new Date(history.changedAt), 'MMM d, HH:mm')}
                                                                    </span>
                                                                    {history.duration && (
                                                                        <span className="flex items-center gap-1 text-slate-500">
                                                                            <Clock className="h-3 w-3" />
                                                                            Stayed in previous status for {(history.duration / 3600000).toFixed(1)}h
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {/* Other Activities */}
                                                    {activities.map((activity, idx) => (
                                                        <div key={idx} className="relative">
                                                            <div className="absolute -left-[30px] w-4 h-4 rounded-full bg-slate-200 border-4 border-white shadow-sm" />
                                                            <div className="p-3 bg-white border rounded-xl shadow-sm text-sm space-y-2">
                                                                <div className="flex items-center gap-2">
                                                                    <strong>{activity.user.name}</strong>
                                                                    <span className="text-slate-500">
                                                                        {activity.action === 'created' ? 'created this task' :
                                                                            activity.action === 'updated' ? 'made changes to this task' :
                                                                                activity.action}
                                                                    </span>
                                                                </div>
                                                                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" />
                                                                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Sidebar Details */}
                    <div className="space-y-6">
                        {/* Assignment Panel */}
                        <Card className="shadow-sm border-none bg-indigo-50/30">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-xs uppercase tracking-wider text-indigo-600 font-bold">People & Team</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Primary Owner */}
                                <div className="space-y-2">
                                    <Label className="text-[10px] text-indigo-500 flex items-center gap-1">
                                        <Shield className="h-3 w-3" />
                                        Primary Responsible
                                    </Label>
                                    <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-indigo-100 shadow-sm">
                                        <Avatar className="h-7 w-7">
                                            <AvatarImage src={task.primaryOwner?.profilePhoto} />
                                            <AvatarFallback className="text-[10px] bg-indigo-100 text-indigo-700">
                                                {task.primaryOwner?.name?.[0] || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-semibold">{task.primaryOwner?.name || 'Unassigned'}</span>
                                    </div>
                                </div>

                                {/* Contributors */}
                                <div className="space-y-2">
                                    <Label className="text-[10px] text-slate-500 uppercase font-bold">Contributors</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {task.contributors?.length > 0 ? (
                                            task.contributors.map((c: any) => (
                                                <Avatar key={c._id} className="h-7 w-7 ring-2 ring-white">
                                                    <AvatarImage src={c.profilePhoto} />
                                                    <AvatarFallback className="text-[10px]">{c?.name?.[0] || '?'}</AvatarFallback>
                                                </Avatar>
                                            ))
                                        ) : (
                                            <div className="text-xs text-muted-foreground py-1 px-3 bg-slate-100 rounded-full">None</div>
                                        )}
                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-white border border-dashed border-slate-300">
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Teams */}
                                <div className="space-y-2">
                                    <Label className="text-[10px] text-slate-500 uppercase font-bold">Work Teams</Label>
                                    <div className="space-y-2">
                                        {task.assignedTeams?.length > 0 ? (
                                            task.assignedTeams.map((team: any) => (
                                                <div key={team._id} className="flex items-center justify-between bg-white px-3 py-1.5 rounded-md border text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="h-3 w-3 text-slate-400" />
                                                        <span className="font-medium">{team.name}</span>
                                                    </div>
                                                    <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-xs text-muted-foreground italic pl-1">No team assigned</div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Timing & Metadata */}
                        <Card className="shadow-sm border-none bg-slate-50">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-xs uppercase tracking-wider text-slate-600 font-bold">Timing & Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-slate-500">Starts</Label>
                                        <div className="text-xs font-semibold flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {task.startDate ? format(new Date(task.startDate), 'MMM d, yyyy') : 'No date'}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-slate-500">Deadline</Label>
                                        <div className={`text-xs font-semibold flex items-center gap-1 ${task.dueDate && new Date(task.dueDate) < new Date() ? 'text-red-600' : ''}`}>
                                            <AlertCircle className="h-3 w-3" />
                                            {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : 'No date'}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <Label className="text-[10px] text-slate-500 uppercase font-bold">Progress</Label>
                                        <span className="text-xs font-bold text-blue-600">
                                            {task.estimatedHours ? `${Math.round(((task.actualHours || 0) / task.estimatedHours) * 100)}%` : 'Manual'}
                                        </span>
                                    </div>
                                    <Progress value={task.estimatedHours ? ((task.actualHours || 0) / task.estimatedHours) * 100 : 0} className="h-1.5" />
                                    <div className="flex justify-between text-[10px] text-muted-foreground">
                                        <span>Spent: {task.actualHours || 0}h</span>
                                        <span>Est: {task.estimatedHours || 0}h</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t space-y-3">
                                    <div className="flex items-center justify-between text-[10px]">
                                        <span className="text-slate-500">Created by</span>
                                        <span className="text-foreground font-semibold">{task.createdBy?.name}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px]">
                                        <span className="text-slate-500">ID reference</span>
                                        <span className="bg-slate-200 px-1.5 py-0.5 rounded font-mono text-[9px]">#{task._id.slice(-8)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 bg-white">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="text-xl font-bold text-slate-900">Edit Task Details</DialogTitle>
                        <DialogDescription>Full control over task parameters, assignments and relationships.</DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="general" className="flex-1 flex flex-col min-h-0">
                        <div className="px-6 border-b">
                            <TabsList className="bg-transparent h-auto p-0 gap-6">
                                <TabsTrigger value="general" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-0 py-3 text-sm font-medium">General Info</TabsTrigger>
                                <TabsTrigger value="assignment" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-0 py-3 text-sm font-medium">Assignments</TabsTrigger>
                                <TabsTrigger value="relations" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-0 py-3 text-sm font-medium">Relationships</TabsTrigger>
                            </TabsList>
                        </div>

                        <ScrollArea className="flex-1 p-6">
                            <TabsContent value="general" className="mt-0 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2 space-y-2">
                                        <Label className="text-xs font-bold uppercase text-slate-500">Task Title</Label>
                                        <Input
                                            value={editData.title || ''}
                                            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                            className="text-lg font-bold h-12 border-slate-200 focus:ring-blue-500"
                                            placeholder="What needs to be done?"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <Label className="text-xs font-bold uppercase text-slate-500">Description</Label>
                                        <Textarea
                                            value={editData.description || ''}
                                            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                            rows={6}
                                            className="resize-none border-slate-200 focus:ring-blue-500"
                                            placeholder="Detailed context about this task..."
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase text-slate-500">Type</Label>
                                            <Select
                                                value={editData.type}
                                                onValueChange={(v: TaskType) => setEditData({ ...editData, type: v })}
                                            >
                                                <SelectTrigger className="w-full bg-slate-50 border-slate-200 h-10"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value={TaskType.BUG}>Bug</SelectItem>
                                                    <SelectItem value={TaskType.FEATURE}>Feature</SelectItem>
                                                    <SelectItem value={TaskType.ENHANCEMENT}>Enhancement</SelectItem>
                                                    <SelectItem value={TaskType.DISCUSSION}>Discussion</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase text-slate-500">Priority (1-5)</Label>
                                            <div className="flex items-center gap-4">
                                                <Input
                                                    type="range" min="1" max="5" step="1"
                                                    value={editData.priority || 3}
                                                    onChange={(e) => setEditData({ ...editData, priority: parseInt(e.target.value) })}
                                                    className="flex-1 accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                                />
                                                <span className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold text-white ${(editData.priority || 3) >= 4 ? 'bg-red-500' :
                                                    (editData.priority || 3) >= 2 ? 'bg-blue-500' : 'bg-slate-500'
                                                    }`}>
                                                    {editData.priority || 3}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase text-slate-500">Timing</Label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <span className="text-[10px] text-slate-400">Start Date</span>
                                                    <Input
                                                        type="date"
                                                        value={editData.startDate as any}
                                                        onChange={(e) => setEditData({ ...editData, startDate: e.target.value as any })}
                                                        className="h-9 border-slate-200"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[10px] text-slate-400">Deadline</span>
                                                    <Input
                                                        type="date"
                                                        value={editData.dueDate as any}
                                                        onChange={(e) => setEditData({ ...editData, dueDate: e.target.value as any })}
                                                        className="h-9 border-slate-200"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase text-slate-500">Estimation (Hours)</Label>
                                            <Input
                                                type="number"
                                                value={editData.estimatedHours || 0}
                                                onChange={(e) => setEditData({ ...editData, estimatedHours: parseInt(e.target.value) })}
                                                className="h-10 border-slate-200"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="assignment" className="mt-0 space-y-6">
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <Label className="text-xs font-bold uppercase text-slate-500">Primary Owner</Label>
                                        <Select
                                            value={(editData.primaryOwner as string)}
                                            onValueChange={(v) => setEditData({ ...editData, primaryOwner: v })}
                                        >
                                            <SelectTrigger className="w-full bg-slate-50 border-slate-200 h-12">
                                                <SelectValue placeholder="Select primary owner" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {activeMembers.map(m => (
                                                    <SelectItem key={m.user._id} value={m.user._id}>
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-5 w-5">
                                                                <AvatarImage src={m.user.profilePhoto} />
                                                                <AvatarFallback>{m.user.name[0]}</AvatarFallback>
                                                            </Avatar>
                                                            <span>{m.user.name}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[10px] text-slate-400">The person mainly responsible for completing this task.</p>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-xs font-bold uppercase text-slate-500">Contributors & Watchers</Label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="border rounded-xl p-4 bg-slate-50/50">
                                                <div className="flex justify-between items-center mb-3">
                                                    <h4 className="text-xs font-bold text-slate-700">Contributors</h4>
                                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">
                                                        {(editData.contributors?.length || 0)}
                                                    </span>
                                                </div>
                                                <ScrollArea className="h-[150px] pr-4">
                                                    <div className="space-y-1">
                                                        {activeMembers.map(m => (
                                                            <div
                                                                key={m.user._id}
                                                                onClick={() => toggleArrayItem('contributors', m.user._id)}
                                                                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${editData.contributors?.includes(m.user._id)
                                                                    ? 'bg-blue-50 border-blue-100 text-blue-700'
                                                                    : 'hover:bg-slate-100'
                                                                    }`}
                                                            >
                                                                {editData.contributors?.includes(m.user._id) ? <CheckCircle2 className="h-4 w-4" /> : <Plus className="h-4 w-4 text-slate-400" />}
                                                                <Avatar className="h-6 w-6">
                                                                    <AvatarImage src={m.user.profilePhoto} />
                                                                    <AvatarFallback>{m.user.name[0]}</AvatarFallback>
                                                                </Avatar>
                                                                <span className="text-xs font-medium truncate">{m.user.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </ScrollArea>
                                            </div>

                                            <div className="border rounded-xl p-4 bg-slate-50/50">
                                                <div className="flex justify-between items-center mb-3">
                                                    <h4 className="text-xs font-bold text-slate-700">Watchers</h4>
                                                    <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-full font-bold">
                                                        {(editData.watchers?.length || 0)}
                                                    </span>
                                                </div>
                                                <ScrollArea className="h-[150px] pr-4">
                                                    <div className="space-y-1">
                                                        {activeMembers.map(m => (
                                                            <div
                                                                key={m.user._id}
                                                                onClick={() => toggleArrayItem('watchers', m.user._id)}
                                                                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${editData.watchers?.includes(m.user._id)
                                                                    ? 'bg-slate-200 text-slate-900 font-bold'
                                                                    : 'hover:bg-slate-100'
                                                                    }`}
                                                            >
                                                                {editData.watchers?.includes(m.user._id) ? <CheckSquare className="h-4 w-4" /> : <Plus className="h-4 w-4 text-slate-400" />}
                                                                <Avatar className="h-6 w-6">
                                                                    <AvatarImage src={m.user.profilePhoto} />
                                                                    <AvatarFallback>{m.user.name[0]}</AvatarFallback>
                                                                </Avatar>
                                                                <span className="text-xs font-medium truncate">{m.user.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </ScrollArea>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="relations" className="mt-0 space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-slate-500">Parent Task</Label>
                                        <Select
                                            value={(editData.parentTask as string)}
                                            onValueChange={(v) => setEditData({ ...editData, parentTask: v === 'none' ? undefined : v })}
                                        >
                                            <SelectTrigger className="w-full bg-slate-50 border-slate-200">
                                                <SelectValue placeholder="Standalone Task" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">None (Root Task)</SelectItem>
                                                {allTasks.filter(t => t._id !== taskId).map(t => (
                                                    <SelectItem key={t._id} value={t._id}>
                                                        <div className="flex items-center gap-2">
                                                            {getTypeIcon(t.type)}
                                                            <span className="truncate max-w-[400px]">{t.title}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Separator className="my-6" />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold uppercase text-slate-500">Blocked By</Label>
                                            <ScrollArea className="h-[200px] border rounded-xl bg-slate-50/50 p-2">
                                                <div className="space-y-1">
                                                    {allTasks.filter(t => t._id !== taskId).map(t => (
                                                        <div
                                                            key={t._id}
                                                            onClick={() => toggleArrayItem('blockedBy', t._id)}
                                                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${editData.blockedBy?.includes(t._id)
                                                                ? 'bg-red-50 text-red-700 border border-red-100'
                                                                : 'hover:bg-slate-200'
                                                                }`}
                                                        >
                                                            {editData.blockedBy?.includes(t._id) ? <Lock className="h-4 w-4" /> : <Plus className="h-4 w-4 text-slate-400" />}
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-xs font-medium truncate">{t.title}</span>
                                                                <Badge variant="outline" className="text-[8px] w-fit h-4 px-1">{t.status}</Badge>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold uppercase text-slate-500">Blocking</Label>
                                            <ScrollArea className="h-[200px] border rounded-xl bg-slate-50/50 p-2">
                                                <div className="space-y-1">
                                                    {allTasks.filter(t => t._id !== taskId).map(t => (
                                                        <div
                                                            key={t._id}
                                                            onClick={() => toggleArrayItem('blocking', t._id)}
                                                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${editData.blocking?.includes(t._id)
                                                                ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                                                : 'hover:bg-slate-200'
                                                                }`}
                                                        >
                                                            {editData.blocking?.includes(t._id) ? <Activity className="h-4 w-4" /> : <Plus className="h-4 w-4 text-slate-400" />}
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-xs font-medium truncate">{t.title}</span>
                                                                <Badge variant="outline" className="text-[8px] w-fit h-4 px-1">{t.status}</Badge>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </ScrollArea>
                    </Tabs>

                    <Separator />
                    <DialogFooter className="p-6 bg-slate-50/50">
                        <Button variant="outline" onClick={() => setShowEditDialog(false)} className="rounded-xl">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveEdit}
                            disabled={submitting}
                            className="bg-blue-600 hover:bg-blue-700 rounded-xl px-8 shadow-md transition-all active:scale-95"
                        >
                            {submitting ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Updating...</span>
                                </div>
                            ) : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Task permanently?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove the task, all comments, and attachments. This action is irreversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {submitting ? 'Deleting...' : 'Delete Permanently'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
};

export default TaskDetail;
