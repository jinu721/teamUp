import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { WorkshopVisibility, CreateWorkshopData, DEFAULT_WORKSHOP_SETTINGS } from '@/types/workshop';
import { ProjectCategory, PROJECT_CATEGORY_LABELS } from '@/types';
import { getErrorMessage } from '@/utils/errorHandling';
import api from '@/services/api';
import { useWorkshops } from '@/hooks/useWorkshops';
import { AppLayout } from '@/components/layout/AppLayout';
import { WorkshopCard } from '@/components/workshop';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Inbox, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const WorkshopList: React.FC = () => {
  const { user } = useAuth();
  const { workshops, loading, addWorkshop } = useWorkshops();
  const [showNewWorkshop, setShowNewWorkshop] = useState(false);
  const [newWorkshop, setNewWorkshop] = useState<CreateWorkshopData>({
    name: '',
    description: '',
    visibility: WorkshopVisibility.PRIVATE,
    category: ProjectCategory.WEB_DEVELOPMENT,
    settings: DEFAULT_WORKSHOP_SETTINGS
  });
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateWorkshop = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const response = await api.createWorkshop(newWorkshop);
      addWorkshop(response.data);
      setNewWorkshop({
        name: '',
        description: '',
        visibility: WorkshopVisibility.PRIVATE,
        category: ProjectCategory.WEB_DEVELOPMENT,
        settings: DEFAULT_WORKSHOP_SETTINGS
      });
      setShowNewWorkshop(false);
      toast({
        title: 'Workshop created',
        description: 'Your workshop has been created successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to create workshop'),
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="page-container">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-container max-w-7xl mx-auto">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="section-header mb-0">
            <h1 className="section-title flex items-center gap-2">
              <Building className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
              Workshops
            </h1>
            <p className="section-description">Manage your workshops and collaborate with teams</p>
          </div>
          <Dialog open={showNewWorkshop} onOpenChange={setShowNewWorkshop}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                New Workshop
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleCreateWorkshop}>
                <DialogHeader>
                  <DialogTitle>Create New Workshop</DialogTitle>
                  <DialogDescription>
                    Create a workshop to organize your projects and teams
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Workshop Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter workshop name"
                      value={newWorkshop.name}
                      onChange={(e) => setNewWorkshop({ ...newWorkshop, name: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (min 10 characters)</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your workshop (minimum 10 characters)"
                      value={newWorkshop.description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewWorkshop({ ...newWorkshop, description: e.target.value })}
                      required
                      minLength={10}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newWorkshop.category}
                      onValueChange={(v: ProjectCategory) => setNewWorkshop({ ...newWorkshop, category: v })}
                    >
                      <SelectTrigger className="h-11">
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
                    <Label htmlFor="visibility">Visibility</Label>
                    <Select
                      value={newWorkshop.visibility}
                      onValueChange={(v: WorkshopVisibility) => setNewWorkshop({ ...newWorkshop, visibility: v })}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={WorkshopVisibility.PRIVATE}>Private</SelectItem>
                        <SelectItem value={WorkshopVisibility.PUBLIC}>Public</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowNewWorkshop(false)} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating} className="w-full sm:w-auto">
                    {creating ? 'Creating...' : 'Create Workshop'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {workshops.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <Inbox className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No workshops yet</h3>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                Get started by creating your first workshop to organize your projects and teams
              </p>
              <Button onClick={() => setShowNewWorkshop(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Workshop
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {workshops.map(workshop => (
              <WorkshopCard
                key={workshop._id}
                workshop={workshop}
                currentUserId={user?._id}
                memberCount={workshop.memberCount}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default WorkshopList;