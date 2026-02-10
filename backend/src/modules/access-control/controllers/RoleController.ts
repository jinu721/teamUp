import { Response, NextFunction } from 'express';
import { IRoleRepository } from '../interfaces/IRoleRepository';
import { IRoleAssignmentRepository } from '../interfaces/IRoleAssignmentRepository';
import { IWorkshopRepository } from '../../workshop/interfaces/IWorkshopRepository';
import { IAuditService } from '../../audit/interfaces/IAuditService';
import { ISocketService } from '../../../shared/interfaces/ISocketService';
import { IPermissionService } from '../interfaces/IPermissionService';
import { AuthRequest } from '../../../shared/types/index';
import {
  CreateRoleDTO,
  UpdateRoleDTO,
  PermissionScope
} from '../../../shared/types/index';
import { NotFoundError, AuthorizationError, ValidationError } from '../../../shared/utils/errors';
import { Types } from 'mongoose';

export class RoleController {
  private socketService: ISocketService | null = null;

  constructor(
    private roleRepository: IRoleRepository,
    private roleAssignmentRepository: IRoleAssignmentRepository,
    private workshopRepository: IWorkshopRepository,
    private auditService: IAuditService,
    private permissionService: IPermissionService
  ) { }

  setSocketService(socketService: ISocketService): void {
    this.socketService = socketService;
  }

  private isValidId(id: any): boolean {
    if (!id) return false;
    return Types.ObjectId.isValid(id.toString());
  }

  createRole = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workshopId } = req.params;
      const actorId = req.user!.id;
      const roleData: CreateRoleDTO = req.body;

      if (!(await this.workshopRepository.isOwnerOrManager(workshopId, actorId))) {
        throw new AuthorizationError('Only workshop managers can create roles');
      }

      const role = await this.roleRepository.create(workshopId, roleData);

      await this.auditService.log({
        workshopId,
        action: 'role_created' as any,
        actorId,
        targetId: role._id.toString(),
        targetType: 'Role',
        details: roleData as any
      });

      if (this.socketService) {
        this.socketService.emitToWorkshop(workshopId, 'role:created', role);
      }

      res.status(201).json({ success: true, data: role });
    } catch (error) {
      next(error);
    }
  };

  getRoles = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workshopId } = req.params;
      const roles = await this.roleRepository.findByWorkshop(workshopId);
      res.json({ success: true, data: roles });
    } catch (error) {
      next(error);
    }
  };

  getRole = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const role = await this.roleRepository.findById(id);
      if (!role) throw new NotFoundError('Role');
      res.json({ success: true, data: role });
    } catch (error) {
      next(error);
    }
  };

  updateRole = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workshopId, id } = req.params;
      const actorId = req.user!.id;
      const updates: UpdateRoleDTO = req.body;

      if (!(await this.workshopRepository.isOwnerOrManager(workshopId, actorId))) {
        throw new AuthorizationError('Only workshop managers can update roles');
      }

      const role = await this.roleRepository.update(id, updates);

      await this.auditService.log({
        workshopId,
        action: 'role_updated' as any,
        actorId,
        targetId: id,
        targetType: 'Role',
        details: updates as any
      });

      const assignments = await this.roleAssignmentRepository.findByRole(id);
      for (const assignment of assignments) {
        const assignedUserId = typeof assignment.user === 'string' ? assignment.user : assignment.user._id.toString();
        this.permissionService.invalidateUserCache(assignedUserId, workshopId);
      }

      if (this.socketService) {
        const eventData = {
          role,
          roleId: id,
          workshopId,
          affectedUserIds: assignments.map(a => typeof a.user === 'string' ? a.user : a.user._id.toString()),
          timestamp: new Date().toISOString()
        };


        this.socketService.emitToWorkshop(workshopId, 'role:updated', eventData);

        for (const assignment of assignments) {
          const assignedUserId = typeof assignment.user === 'string' ? assignment.user : assignment.user._id.toString();
          this.socketService.emitToUser(assignedUserId, 'role:updated', eventData);
        }
      }

      res.json({ success: true, data: role });
    } catch (error) {
      next(error);
    }
  };

  deleteRole = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workshopId, id } = req.params;
      const actorId = req.user!.id;

      if (!(await this.workshopRepository.isOwnerOrManager(workshopId, actorId))) {
        throw new AuthorizationError('Only workshop managers can delete roles');
      }

      await this.roleAssignmentRepository.deleteByRole(id);
      await this.roleRepository.delete(id);

      await this.auditService.log({
        workshopId,
        action: 'role_deleted' as any,
        actorId,
        targetId: id,
        targetType: 'Role'
      });

      if (this.socketService) {
        this.socketService.emitToWorkshop(workshopId, 'role:deleted', { roleId: id, workshopId });
      }

      res.json({ success: true, message: 'Role deleted' });
    } catch (error) {
      next(error);
    }
  };

  assignRole = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workshopId, id } = req.params;
      const actorId = req.user!.id;
      const { userId, scopeId: providedScopeId } = req.body;

      if (!userId) throw new ValidationError('User ID is required');

      if (!(await this.workshopRepository.isOwnerOrManager(workshopId, actorId))) {
        throw new AuthorizationError('Only workshop managers can assign roles');
      }

      const role = await this.roleRepository.findById(id);
      if (!role) throw new NotFoundError('Role');

      let finalScopeId: string | undefined = undefined;
      if (role.scope !== PermissionScope.WORKSHOP) {
        const sid = role.scopeId ? role.scopeId.toString() : providedScopeId;
        if (!this.isValidId(sid)) {
          throw new ValidationError(`Scope ID (Project/Team) is required for ${role.scope} scoped roles`);
        }
        finalScopeId = sid;
      }

      const alreadyAssigned = await this.roleAssignmentRepository.exists(workshopId, id, userId, role.scope, finalScopeId);
      if (alreadyAssigned) {
        throw new ValidationError('Role already assigned to this user at this scope');
      }

      const assignment = await this.roleAssignmentRepository.create({
        workshopId,
        roleId: id,
        userId,
        scope: role.scope,
        scopeId: finalScopeId,
        assignedBy: actorId
      });

      await this.auditService.log({
        workshopId,
        action: 'role_assigned' as any,
        actorId,
        targetId: userId,
        targetType: 'User',
        details: { roleId: id, scope: role.scope, scopeId: finalScopeId }
      });

      this.permissionService.invalidateUserCache(userId, workshopId);

      if (this.socketService) {
        const eventData = {
          assignment,
          userId,
          roleId: id,
          workshopId,
          timestamp: new Date().toISOString()
        };


        this.socketService.emitToWorkshop(workshopId, 'role:assigned', eventData);
        this.socketService.emitToWorkshop(workshopId, 'role:updated', eventData);

        this.socketService.emitToUser(userId, 'role:assigned', eventData);
        this.socketService.emitToUser(userId, 'role:updated', eventData);
      }

      res.json({ success: true, data: assignment });
    } catch (error) {
      next(error);
    }
  };

  revokeRole = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workshopId, id, userId } = req.params;
      const actorId = req.user!.id;

      if (!(await this.workshopRepository.isOwnerOrManager(workshopId, actorId))) {
        throw new AuthorizationError('Only workshop managers can revoke roles');
      }

      await this.roleAssignmentRepository.deleteByUserAndRole(workshopId, userId, id);

      await this.auditService.log({
        workshopId,
        action: 'role_revoked' as any,
        actorId,
        targetId: userId,
        targetType: 'User',
        details: { roleId: id }
      });

      this.permissionService.invalidateUserCache(userId, workshopId);

      if (this.socketService) {
        const eventData = {
          userId,
          roleId: id,
          workshopId,
          timestamp: new Date().toISOString()
        };


        this.socketService.emitToWorkshop(workshopId, 'role:revoked', eventData);

        this.socketService.emitToUser(userId, 'role:revoked', eventData);
      }

      res.json({ success: true, message: 'Role revoked' });
    } catch (error) {
      next(error);
    }
  };

  getUserRoles = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workshopId, userId } = req.params;
      const assignments = await this.roleAssignmentRepository.findByUser(workshopId, userId);
      res.json({ success: true, data: assignments });
    } catch (error) {
      next(error);
    }
  };
}