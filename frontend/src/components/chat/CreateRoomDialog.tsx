import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { chatApi } from '@/services/chatApi';
import { useToast } from '@/hooks/use-toast';

interface CreateRoomDialogProps {
    workshopId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (room: any) => void;
    projects: any[];
    teams: any[];
}

export const CreateRoomDialog: React.FC<CreateRoomDialogProps> = ({
    workshopId,
    open,
    onOpenChange,
    onSuccess,
    projects,
    teams
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [roomType, setRoomType] = useState<'workshop' | 'project' | 'team'>('workshop');
    const [projectId, setProjectId] = useState<string | undefined>(undefined);
    const [teamId, setTeamId] = useState<string | undefined>(undefined);
    const [submitting, setSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async () => {
        if (!name.trim()) return;
        setSubmitting(true);
        try {
            const response = await chatApi.createRoom(workshopId, {
                name: name.trim(),
                description: description.trim(),
                roomType,
                projectId: roomType === 'project' ? projectId : undefined,
                teamId: roomType === 'team' ? teamId : undefined,
            });
            toast({ title: 'Success', description: 'Chat room created successfully' });
            onSuccess(response.data);
            onOpenChange(false);
            // Reset form
            setName('');
            setDescription('');
            setRoomType('workshop');
            setProjectId(undefined);
            setTeamId(undefined);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to create chat room',
                variant: 'destructive'
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Chat Channel</DialogTitle>
                    <DialogDescription>
                        Create a new channel for discussion.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Channel Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. general-discussions"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            placeholder="What is this channel about?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="type">Channel Type</Label>
                        <Select value={roomType} onValueChange={(v: any) => setRoomType(v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="workshop">General Workshop</SelectItem>
                                <SelectItem value="project">Project Specific</SelectItem>
                                <SelectItem value="team">Team Specific</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {roomType === 'project' && (
                        <div className="grid gap-2">
                            <Label htmlFor="project">Select Project</Label>
                            <Select value={projectId} onValueChange={setProjectId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select project" />
                                </SelectTrigger>
                                <SelectContent>
                                    {projects.map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {roomType === 'team' && (
                        <div className="grid gap-2">
                            <Label htmlFor="team">Select Team</Label>
                            <Select value={teamId} onValueChange={setTeamId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select team" />
                                </SelectTrigger>
                                <SelectContent>
                                    {teams.map(t => <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={submitting || !name.trim()}>
                        {submitting ? 'Creating...' : 'Create Channel'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
