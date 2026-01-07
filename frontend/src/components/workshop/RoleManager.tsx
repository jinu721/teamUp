import React, { useState } from 'react';
import { Role, Permission, PermissionType, PERMISSION_SCOPE_LABELS } from '@/types/workshop';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Shield, Plus, MoreVertical, Edit, Trash2, Check } from 'lucide-react';

interface RoleManagerProps {
  roles: Role[];
  canManage: boolean;
  onCreateRole?: (data: { name: string; description: string; permissions: Permission[] }) => void;
  onEditRole?: (roleId: string, data: { name?: string; description?: string; permissions?: Permission[] }) => void;
  onDeleteRole?: (roleId: string) => void;
}

export const RoleManager: React.FC<RoleManagerProps> = ({
  roles,
  canManage,
  onCreateRole,
  onEditRole,
  onDeleteRole
}) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState<Permission[]>([]);

  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editRoleName, setEditRoleName] = useState('');
  const [editRoleDescription, setEditRoleDescription] = useState('');
  const [editRolePermissions, setEditRolePermissions] = useState<Permission[]>([]);

  const isEditDialogOpen = !!editingRole;

  const handleCreateRole = () => {
    if (newRoleName.trim()) {
      onCreateRole?.({
        name: newRoleName.trim(),
        description: newRoleDescription.trim(),
        permissions: newRolePermissions
      });
      setNewRoleName('');
      setNewRoleDescription('');
      setNewRolePermissions([]);
      setIsCreateDialogOpen(false);
    }
  };

  const handleEditRole = () => {
    if (editingRole && editRoleName.trim()) {
      onEditRole?.(editingRole._id, {
        name: editRoleName.trim(),
        description: editRoleDescription.trim(),
        permissions: editRolePermissions
      });
      setEditingRole(null);
    }
  };

  const startEditing = (role: Role) => {
    setEditingRole(role);
    setEditRoleName(role.name);
    setEditRoleDescription(role.description || '');
    setEditRolePermissions(role.permissions || []);
  };

  const togglePermission = (action: string, resource: string, isEdit = false) => {
    const setFunc = isEdit ? setEditRolePermissions : setNewRolePermissions;
    setFunc(prev => {
      const exists = prev.find(p => p.action === action && p.resource === resource);
      if (exists) {
        return prev.filter(p => !(p.action === action && p.resource === resource));
      } else {
        return [...prev, { action, resource, type: PermissionType.GRANT }];
      }
    });
  };

  const commonPermissions = [
    { label: 'Manage Members', action: 'manage', resource: 'membership' },
    { label: 'Create Projects', action: 'create', resource: 'project' },
    { label: 'Manage Teams', action: 'manage', resource: 'team' },
    { label: 'Manage Tasks', action: 'manage', resource: 'task' },
    { label: 'Create Channels', action: 'create', resource: 'chat_room' },
    { label: 'Manage Channels', action: 'manage', resource: 'chat_room' },
    { label: 'View Audit Logs', action: 'view', resource: 'audit' },
  ];

  const getPermissionBadgeVariant = (type: PermissionType) => {
    return type === PermissionType.GRANT ? 'default' as const : 'destructive' as const;
  };

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Role
          </Button>
        </div>
      )}

      {roles.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground bg-card/30 rounded-xl border border-dashed">
          No custom roles defined yet
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <Card key={role._id} className="relative overflow-hidden group hover:shadow-md transition-all border-border/50">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      {role.name}
                    </CardTitle>
                    {role.description && (
                      <CardDescription className="text-xs line-clamp-1">{role.description}</CardDescription>
                    )}
                  </div>
                  {canManage && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEditing(role)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Role
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDeleteRole?.(role._id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Role
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                    <span>Scope:</span>
                    <Badge variant="outline" className="text-[10px] rounded-sm py-0 h-4">{PERMISSION_SCOPE_LABELS[role.scope]}</Badge>
                  </div>

                  {role.permissions.length > 0 ? (
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Permissions:</span>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 6).map((perm, idx) => (
                          <Badge
                            key={idx}
                            variant={getPermissionBadgeVariant(perm.type)}
                            className="text-[9px] h-5 font-medium"
                          >
                            {perm.action}:{perm.resource}
                          </Badge>
                        ))}
                        {role.permissions.length > 6 && (
                          <Badge variant="outline" className="text-[9px] h-5">
                            +{role.permissions.length - 6} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No permissions defined</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Role Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Define capabilities for this role within the workshop.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="roleName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Role Name</Label>
              <Input
                id="roleName"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="e.g., Project Lead"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleDescription" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
              <Textarea
                id="roleDescription"
                value={newRoleDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewRoleDescription(e.target.value)}
                placeholder="What can this role do?"
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Capabilities</Label>
              <div className="grid grid-cols-1 gap-2">
                {commonPermissions.map((perm) => {
                  const isSelected = newRolePermissions.some(p => p.action === perm.action && p.resource === perm.resource);
                  return (
                    <Button
                      key={`${perm.action}-${perm.resource}`}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "justify-start text-xs font-medium h-9 px-3 transition-all",
                        isSelected && "shadow-sm border-primary"
                      )}
                      onClick={() => togglePermission(perm.action, perm.resource)}
                    >
                      <div className={cn(
                        "h-4 w-4 rounded-full border mr-2 flex items-center justify-center transition-all",
                        isSelected ? "bg-primary-foreground border-transparent" : "border-muted-foreground/30"
                      )}>
                        {isSelected && <Check className="h-2.5 w-2.5 text-primary" />}
                      </div>
                      {perm.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter className="bg-muted/30 -mx-6 -mb-6 p-4 px-6 rounded-b-lg">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="h-10">
              Cancel
            </Button>
            <Button onClick={handleCreateRole} disabled={!newRoleName.trim()} className="h-10 min-w-[100px]">
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => !open && setEditingRole(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Role: {editingRole?.name}</DialogTitle>
            <DialogDescription>
              Update capabilities and details for this role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="editRoleName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Role Name</Label>
              <Input
                id="editRoleName"
                value={editRoleName}
                onChange={(e) => setEditRoleName(e.target.value)}
                placeholder="e.g., Project Lead"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRoleDescription" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
              <Textarea
                id="editRoleDescription"
                value={editRoleDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditRoleDescription(e.target.value)}
                placeholder="What can this role do?"
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Capabilities</Label>
              <div className="grid grid-cols-1 gap-2">
                {commonPermissions.map((perm) => {
                  const isSelected = editRolePermissions.some(p => p.action === perm.action && p.resource === perm.resource);
                  return (
                    <Button
                      key={`edit-${perm.action}-${perm.resource}`}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "justify-start text-xs font-medium h-9 px-3 transition-all",
                        isSelected && "shadow-sm border-primary"
                      )}
                      onClick={() => togglePermission(perm.action, perm.resource, true)}
                    >
                      <div className={cn(
                        "h-4 w-4 rounded-full border mr-2 flex items-center justify-center transition-all",
                        isSelected ? "bg-primary-foreground border-transparent" : "border-muted-foreground/30"
                      )}>
                        {isSelected && <Check className="h-2.5 w-2.5 text-primary" />}
                      </div>
                      {perm.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter className="bg-muted/30 -mx-6 -mb-6 p-4 px-6 rounded-b-lg">
            <Button variant="outline" onClick={() => setEditingRole(null)} className="h-10">
              Cancel
            </Button>
            <Button onClick={handleEditRole} disabled={!editRoleName.trim()} className="h-10 min-w-[100px]">
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
