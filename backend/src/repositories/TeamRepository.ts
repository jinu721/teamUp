import { Team } from '../models/Team';
import { ITeam, CreateTeamDTO, UpdateTeamDTO } from '../types';
import { Types } from 'mongoose';
import { NotFoundError } from '../utils/errors';

export class TeamRepository {
  private readonly populateMembers = { path: 'members', select: 'name email profilePhoto skills' };
  private readonly populateWorkshop = { path: 'workshop', select: 'name description' };

  async create(workshopId: string, teamData: CreateTeamDTO): Promise<ITeam> {
    const team = new Team({
      ...teamData,
      workshop: new Types.ObjectId(workshopId),
      members: [],
      internalRoles: []
    });
    const saved = await team.save();
    return await this.findById(saved._id.toString()) as ITeam;
  }

  async findById(id: string): Promise<ITeam | null> {
    return await Team.findById(id)
      .populate(this.populateMembers)
      .populate(this.populateWorkshop);
  }

  async findByWorkshop(workshopId: string): Promise<ITeam[]> {
    return await Team.find({ workshop: new Types.ObjectId(workshopId) })
      .populate(this.populateMembers)
      .sort({ name: 1 });
  }

  async findByMemberInWorkshop(workshopId: string, userId: string): Promise<ITeam[]> {
    return await Team.find({
      workshop: new Types.ObjectId(workshopId),
      members: new Types.ObjectId(userId)
    })
      .populate(this.populateMembers)
      .sort({ name: 1 });
  }

  async update(id: string, updates: UpdateTeamDTO): Promise<ITeam> {
    const team = await Team.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate(this.populateMembers)
      .populate(this.populateWorkshop);

    if (!team) {
      throw new NotFoundError('Team');
    }

    return team;
  }

  async delete(id: string): Promise<void> {
    const result = await Team.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundError('Team');
    }
  }

  async deleteByWorkshop(workshopId: string): Promise<void> {
    await Team.deleteMany({ workshop: new Types.ObjectId(workshopId) });
  }

  async addMember(teamId: string, userId: string): Promise<ITeam> {
    const team = await Team.findByIdAndUpdate(
      teamId,
      { $addToSet: { members: new Types.ObjectId(userId) } },
      { new: true }
    )
      .populate(this.populateMembers)
      .populate(this.populateWorkshop);

    if (!team) {
      throw new NotFoundError('Team');
    }

    return team;
  }

  async removeMember(teamId: string, userId: string): Promise<ITeam> {
    const team = await Team.findByIdAndUpdate(
      teamId,
      { 
        $pull: { 
          members: new Types.ObjectId(userId),
          'internalRoles.$[].members': new Types.ObjectId(userId)
        }
      },
      { new: true }
    )
      .populate(this.populateMembers)
      .populate(this.populateWorkshop);

    if (!team) {
      throw new NotFoundError('Team');
    }

    return team;
  }

  async isMember(teamId: string, userId: string): Promise<boolean> {
    const team = await Team.findById(teamId);
    return team?.members.some(m => m.toString() === userId) || false;
  }

  async countMembers(teamId: string): Promise<number> {
    const team = await Team.findById(teamId);
    return team?.members.length || 0;
  }

  async assignInternalRole(teamId: string, roleName: string, userId: string): Promise<ITeam> {
    // First, ensure the role exists
    await Team.findByIdAndUpdate(
      teamId,
      {
        $addToSet: {
          internalRoles: {
            $each: [{ name: roleName, permissions: [], members: [] }]
          }
        }
      }
    );

    // Then add the user to the role
    const team = await Team.findByIdAndUpdate(
      teamId,
      {
        $addToSet: {
          'internalRoles.$[role].members': new Types.ObjectId(userId)
        }
      },
      {
        arrayFilters: [{ 'role.name': roleName }],
        new: true
      }
    )
      .populate(this.populateMembers)
      .populate(this.populateWorkshop);

    if (!team) {
      throw new NotFoundError('Team');
    }

    return team;
  }

  async removeInternalRole(teamId: string, roleName: string, userId: string): Promise<ITeam> {
    const team = await Team.findByIdAndUpdate(
      teamId,
      {
        $pull: {
          'internalRoles.$[role].members': new Types.ObjectId(userId)
        }
      },
      {
        arrayFilters: [{ 'role.name': roleName }],
        new: true
      }
    )
      .populate(this.populateMembers)
      .populate(this.populateWorkshop);

    if (!team) {
      throw new NotFoundError('Team');
    }

    return team;
  }

  async getUserInternalRoles(teamId: string, userId: string): Promise<string[]> {
    const team = await Team.findById(teamId);
    if (!team) return [];

    const roles: string[] = [];
    for (const role of team.internalRoles) {
      if (role.members.some(m => m.toString() === userId)) {
        roles.push(role.name);
      }
    }

    return roles;
  }

  async countByWorkshop(workshopId: string): Promise<number> {
    return await Team.countDocuments({ workshop: new Types.ObjectId(workshopId) });
  }
}