import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface EditRoomDialogProps {
    room: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate: (data: { name: string; description: string }) => Promise<void>;
}

export const EditRoomDialog: React.FC<EditRoomDialogProps> = ({
    room,
    open,
    onOpenChange,
    onUpdate
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (room) {
            setName(room.name || '');
            setDescription(room.description || '');
        }
    }, [room]);

    const handleSubmit = async () => {
        if (!name.trim()) return;
        setSubmitting(true);
        try {
            await onUpdate({
                name: name.trim(),
                description: description.trim()
            });
            toast({ title: 'Success', description: 'Chat room updated successfully' });
            onOpenChange(false);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to update chat room',
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
                    <DialogTitle>Edit Channel</DialogTitle>
                    <DialogDescription>
                        Update channel information.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="edit-name">Channel Name</Label>
                        <Input
                            id="edit-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-description">Description</Label>
                        <Textarea
                            id="edit-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={submitting || !name.trim()}>
                        {submitting ? 'Updating...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};