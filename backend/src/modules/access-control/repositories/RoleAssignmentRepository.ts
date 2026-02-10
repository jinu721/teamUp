import { RoleAssignment } from '../models/RoleAssignment';
import { IRoleAssignment, PermissionScope } from '../types/index';
import { Types } from 'mongoose';
import { NotFoundError } from '../../../shared/utils/errors';
import { IRoleAssignmentRepository } from '../interfaces/IRoleAssignmentRepository';

export interface CreateRoleAssignmentDTO {
  workshopId: string;
  roleId: string;
  userId: string;
  scope: PermissionScope;
  scopeId?: string;
  assignedBy: string;
}

export class RoleAssignmentRepository implements IRoleAssignmentRepository {
  private readonly populateRole = { path: 'role', select: 'name description permissions scope' };
  private readonly populateUser = { path: 'user', select: 'name email profilePhoto' };
  private readonly populateAssignedBy = { path: 'assignedBy', select: 'name email' };

  async create(assignmentData: CreateRoleAssignmentDTO): Promise<IRoleAssignment> {
    const assignment = new RoleAssignment({
      workshop: Types.ObjectId.isValid(assignmentData.workshopId) ? new Types.ObjectId(assignmentData.workshopId) : undefined,
      role: Types.ObjectId.isValid(assignmentData.roleId) ? new Types.ObjectId(assignmentData.roleId) : undefined,
      user: Types.ObjectId.isValid(assignmentData.userId) ? new Types.ObjectId(assignmentData.userId) : undefined,
      scope: assignmentData.scope,
      scopeId: (assignmentData.scopeId && Types.ObjectId.isValid(assignmentData.scopeId)) ? new Types.ObjectId(assignmentData.scopeId) : undefined,
      assignedBy: Types.ObjectId.isValid(assignmentData.assignedBy) ? new Types.ObjectId(assignmentData.assignedBy) : undefined
    });
    const saved = await assignment.save();
    return await this.findById(saved._id.toString()) as IRoleAssignment;
  }

  async findById(id: string): Promise<IRoleAssignment | null> {
    return await RoleAssignment.findById(id)
      .populate(this.populateRole)
      .populate(this.populateUser)
      .populate(this.populateAssignedBy);
  }

  async findByUser(workshopId: string, userId: string): Promise<IRoleAssignment[]> {
    return await RoleAssignment.find({
      workshop: new Types.ObjectId(workshopId),
      user: new Types.ObjectId(userId)
    })
      .populate(this.populateRole)
      .populate(this.populateAssignedBy)
      .sort({ createdAt: -1 });
  }

  async findByUserAndScope(
    workshopId: string,
    userId: string,
    scope: PermissionScope,
    scopeId?: string
  ): Promise<IRoleAssignment[]> {
    const query: any = {
      workshop: new Types.ObjectId(workshopId),
      user: new Types.ObjectId(userId),
      scope
    };

    if (scopeId) {
      query.scopeId = new Types.ObjectId(scopeId);
    } else {
      query.scopeId = { $exists: false };
    }

    return await RoleAssignment.find(query)
      .populate(this.populateRole)
      .populate(this.populateAssignedBy)
      .sort({ createdAt: -1 });
  }

  async findByRole(roleId: string): Promise<IRoleAssignment[]> {
    return await RoleAssignment.find({ role: new Types.ObjectId(roleId) })
      .populate(this.populateUser)
      .populate(this.populateAssignedBy)
      .sort({ createdAt: -1 });
  }

  async findByWorkshop(workshopId: string): Promise<IRoleAssignment[]> {
    return await RoleAssignment.find({ workshop: new Types.ObjectId(workshopId) })
      .populate(this.populateRole)
      .populate(this.populateUser)
      .populate(this.populateAssignedBy)
      .sort({ createdAt: -1 });
  }

  async findByScope(
    workshopId: string,
    scope: PermissionScope,
    scopeId?: string
  ): Promise<IRoleAssignment[]> {
    const query: any = {
      workshop: new Types.ObjectId(workshopId),
      scope
    };

    if (scopeId) {
      query.scopeId = new Types.ObjectId(scopeId);
    } else {
      query.scopeId = { $exists: false };
    }

    return await RoleAssignment.find(query)
      .populate(this.populateRole)
      .populate(this.populateUser)
      .populate(this.populateAssignedBy)
      .sort({ createdAt: -1 });
  }

  async delete(id: string): Promise<void> {
    const result = await RoleAssignment.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundError('Role Assignment');
    }
  }

  async deleteByUser(workshopId: string, userId: string): Promise<void> {
    await RoleAssignment.deleteMany({
      workshop: new Types.ObjectId(workshopId),
      user: new Types.ObjectId(userId)
    });
  }

  async deleteByUserAndRole(workshopId: string, userId: string, roleId: string): Promise<void> {
    await RoleAssignment.deleteMany({
      workshop: new Types.ObjectId(workshopId),
      user: new Types.ObjectId(userId),
      role: new Types.ObjectId(roleId)
    });
  }

  async deleteByRole(roleId: string): Promise<void> {
    await RoleAssignment.deleteMany({ role: new Types.ObjectId(roleId) });
  }

  async deleteByWorkshop(workshopId: string): Promise<void> {
    await RoleAssignment.deleteMany({ workshop: new Types.ObjectId(workshopId) });
  }

  async deleteByScope(
    workshopId: string,
    scope: PermissionScope,
    scopeId?: string
  ): Promise<void> {
    const query: any = {
      workshop: new Types.ObjectId(workshopId),
      scope
    };

    if (scopeId) {
      query.scopeId = new Types.ObjectId(scopeId);
    }

    await RoleAssignment.deleteMany(query);
  }

  async exists(
    workshopId: string,
    roleId: string,
    userId: string,
    scope: PermissionScope,
    scopeId?: string
  ): Promise<boolean> {
    const query: any = {
      workshop: new Types.ObjectId(workshopId),
      role: new Types.ObjectId(roleId),
      user: new Types.ObjectId(userId),
      scope
    };

    if (scopeId) {
      query.scopeId = new Types.ObjectId(scopeId);
    } else {
      query.scopeId = { $exists: false };
    }

    const assignment = await RoleAssignment.findOne(query);
    return !!assignment;
  }

  async countByUser(workshopId: string, userId: string): Promise<number> {
    return await RoleAssignment.countDocuments({
      workshop: new Types.ObjectId(workshopId),
      user: new Types.ObjectId(userId)
    });
  }

  async countByRole(roleId: string): Promise<number> {
    return await RoleAssignment.countDocuments({ role: new Types.ObjectId(roleId) });
  }

  async countByWorkshop(workshopId: string): Promise<number> {
    return await RoleAssignment.countDocuments({ workshop: new Types.ObjectId(workshopId) });
  }
}