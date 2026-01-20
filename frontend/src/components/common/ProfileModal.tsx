import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Loader2, Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface ProfileModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ open, onOpenChange }) => {
    const { user, updateProfile } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || '');
    const [skillInput, setSkillInput] = useState('');
    const [skills, setSkills] = useState<string[]>(user?.skills || []);
    const [interestInput, setInterestInput] = useState('');
    const [interests, setInterests] = useState<string[]>(user?.interests || []);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name);
            setProfilePhoto(user.profilePhoto || '');
            setSkills(user.skills || []);
            setInterests(user.interests || []);
        }
    }, [user]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const response = await api.uploadFile(file, 'image');
            setProfilePhoto(response.data.fileUrl);
            toast({
                title: "Success",
                description: "Profile picture uploaded successfully",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to upload image",
                variant: "destructive",
            });
        } finally {
            setUploading(false);
        }
    };

    const handleAddSkill = (e: React.FormEvent) => {
        e.preventDefault();
        if (skillInput.trim() && !skills.includes(skillInput.trim())) {
            setSkills([...skills, skillInput.trim()]);
            setSkillInput('');
        }
    };

    const removeSkill = (skill: string) => {
        setSkills(skills.filter(s => s !== skill));
    };

    const handleAddInterest = (e: React.FormEvent) => {
        e.preventDefault();
        if (interestInput.trim() && !interests.includes(interestInput.trim())) {
            setInterests([...interests, interestInput.trim()]);
            setInterestInput('');
        }
    };

    const removeInterest = (interest: string) => {
        setInterests(interests.filter(i => i !== interest));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateProfile({
                name,
                profilePhoto,
                skills,
                interests
            });
            toast({
                title: "Profile updated",
                description: "Your profile information has been saved successfully.",
            });
            onOpenChange(false);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update profile",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Edit Profile</DialogTitle>
                    <DialogDescription>
                        Update your personal information and profile settings.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center space-y-3">
                        <div className="relative group">
                            <Avatar className="h-24 w-24 ring-2 ring-primary/20 transition-all group-hover:ring-primary/40">
                                <AvatarImage src={profilePhoto} alt={name} />
                                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                    {name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <label
                                htmlFor="avatar-upload"
                                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                            >
                                {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
                            </label>
                            <input
                                id="avatar-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileUpload}
                                disabled={uploading}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">Click to change profile photo</p>
                    </div>

                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your full name"
                                required
                            />
                        </div>

                        {/* Skills */}
                        <div className="space-y-2">
                            <Label>Skills</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={skillInput}
                                    onChange={(e) => setSkillInput(e.target.value)}
                                    placeholder="Add a skill (e.g. React, UI Design)"
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill(e as any))}
                                />
                                <Button type="button" size="icon" variant="outline" onClick={handleAddSkill}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {skills.map(skill => (
                                    <Badge key={skill} variant="secondary" className="pl-2 gap-1 py-1">
                                        {skill}
                                        <button type="button" onClick={() => removeSkill(skill)} className="hover:text-destructive transition-colors">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                                {skills.length === 0 && <p className="text-xs text-muted-foreground">No skills added yet</p>}
                            </div>
                        </div>

                        {/* Interests */}
                        <div className="space-y-2">
                            <Label>Interests</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={interestInput}
                                    onChange={(e) => setInterestInput(e.target.value)}
                                    placeholder="Add an interest (e.g. Open Source, AI)"
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInterest(e as any))}
                                />
                                <Button type="button" size="icon" variant="outline" onClick={handleAddInterest}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {interests.map(interest => (
                                    <Badge key={interest} variant="outline" className="pl-2 gap-1 py-1">
                                        {interest}
                                        <button type="button" onClick={() => removeInterest(interest)} className="hover:text-destructive transition-colors">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                                {interests.length === 0 && <p className="text-xs text-muted-foreground">No interests added yet</p>}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
