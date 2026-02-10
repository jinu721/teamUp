import { Role } from '../models/Role';
import { IRole, CreateRoleDTO, UpdateRoleDTO, PermissionScope } from '../../../shared/types/index';
import { Types } from 'mongoose';
import { NotFoundError } from '../../../shared/utils/errors';
import { IRoleRepository } from '../interfaces/IRoleRepository';

export class RoleRepository implements IRoleRepository {
  private readonly populateWorkshop = { path: 'workshop', select: 'name description' };

  async create(workshopId: string, roleData: CreateRoleDTO): Promise<IRole> {
    const role = new Role({
      ...roleData,
      workshop: new Types.ObjectId(workshopId),
      scopeId: roleData.scopeId ? new Types.ObjectId(roleData.scopeId) : undefined
    });
    const saved = await role.save();
    return await this.findById(saved._id.toString()) as IRole;
  }

  async findById(id: string): Promise<IRole | null> {
    return await Role.findById(id).populate(this.populateWorkshop);
  }

  async findByWorkshop(workshopId: string): Promise<IRole[]> {
    return await Role.find({ workshop: new Types.ObjectId(workshopId) })
      .sort({ name: 1 });
  }

  async findByScope(
    workshopId: string,
    scope: PermissionScope,
    scopeId?: string
  ): Promise<IRole[]> {
    const query: any = {
      workshop: new Types.ObjectId(workshopId),
      scope
    };

    if (scopeId) {
      query.scopeId = new Types.ObjectId(scopeId);
    } else {
      query.scopeId = { $exists: false };
    }

    return await Role.find(query).sort({ name: 1 });
  }

  async findByName(workshopId: string, name: string): Promise<IRole | null> {
    return await Role.findOne({
      workshop: new Types.ObjectId(workshopId),
      name
    }).populate(this.populateWorkshop);
  }

  async update(id: string, updates: UpdateRoleDTO): Promise<IRole> {
    const role = await Role.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate(this.populateWorkshop);

    if (!role) {
      throw new NotFoundError('Role');
    }

    return role;
  }

  async delete(id: string): Promise<void> {
    const result = await Role.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundError('Role');
    }
  }

  async deleteByWorkshop(workshopId: string): Promise<void> {
    await Role.deleteMany({ workshop: new Types.ObjectId(workshopId) });
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

    await Role.deleteMany(query);
  }

  async exists(workshopId: string, name: string): Promise<boolean> {
    const role = await Role.findOne({
      workshop: new Types.ObjectId(workshopId),
      name
    });
    return !!role;
  }

  async countByWorkshop(workshopId: string): Promise<number> {
    return await Role.countDocuments({ workshop: new Types.ObjectId(workshopId) });
  }

  async countByScope(
    workshopId: string,
    scope: PermissionScope,
    scopeId?: string
  ): Promise<number> {
    const query: any = {
      workshop: new Types.ObjectId(workshopId),
      scope
    };

    if (scopeId) {
      query.scopeId = new Types.ObjectId(scopeId);
    }

    return await Role.countDocuments(query);
  }

  async searchByName(workshopId: string, searchTerm: string): Promise<IRole[]> {
    return await Role.find({
      workshop: new Types.ObjectId(workshopId),
      name: { $regex: searchTerm, $options: 'i' }
    }).sort({ name: 1 });
  }
}