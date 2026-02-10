import { Membership } from '../models/Membership';
import { IMembership, MembershipState, MembershipSource, CreateMembershipDTO } from '../types/index';
import { Types } from 'mongoose';
import { NotFoundError } from '../../../shared/utils/errors';
import { IMembershipRepository } from '../interfaces/IMembershipRepository';


export class MembershipRepository implements IMembershipRepository {
  private readonly populateUser = { path: 'user', select: 'name email profilePhoto' };
  private readonly populateWorkshop = { path: 'workshop', select: 'name description visibility' };
  private readonly populateInvitedBy = { path: 'invitedBy', select: 'name email' };
  private readonly populateRemovedBy = { path: 'removedBy', select: 'name email' };

  async create(membershipData: CreateMembershipDTO): Promise<IMembership> {
    const membership = new Membership({
      workshop: new Types.ObjectId(membershipData.workshopId),
      user: new Types.ObjectId(membershipData.userId),
      source: membershipData.source,
      state: membershipData.state || MembershipState.PENDING,
      invitedBy: membershipData.invitedBy ? new Types.ObjectId(membershipData.invitedBy) : undefined
    });
    const saved = await membership.save();
    return await this.findById(saved._id.toString()) as IMembership;
  }

  async findById(id: string): Promise<IMembership | null> {
    return await Membership.findById(id)
      .populate(this.populateUser)
      .populate(this.populateWorkshop)
      .populate(this.populateInvitedBy)
      .populate(this.populateRemovedBy);
  }

  async findByIdRaw(id: string): Promise<IMembership | null> {
    return await Membership.findById(id);
  }

  async findByWorkshop(workshopId: string, state?: MembershipState): Promise<IMembership[]> {
    if (!Types.ObjectId.isValid(workshopId)) return [];
    const query: any = { workshop: new Types.ObjectId(workshopId) };
    if (state) {
      query.state = state;
    }

    return await Membership.find(query)
      .populate(this.populateUser)
      .populate(this.populateInvitedBy)
      .populate(this.populateRemovedBy)
      .sort({ createdAt: -1 });
  }

  async findByUser(userId: string, state?: MembershipState): Promise<IMembership[]> {
    if (!Types.ObjectId.isValid(userId)) return [];
    const query: any = { user: new Types.ObjectId(userId) };
    if (state) {
      query.state = state;
    }

    return await Membership.find(query)
      .populate(this.populateWorkshop)
      .populate(this.populateInvitedBy)
      .populate(this.populateRemovedBy)
      .sort({ createdAt: -1 });
  }

  async findByWorkshopAndUser(workshopId: string, userId: string): Promise<IMembership | null> {
    if (!Types.ObjectId.isValid(workshopId) || !Types.ObjectId.isValid(userId)) return null;
    return await Membership.findOne({
      workshop: new Types.ObjectId(workshopId),
      user: new Types.ObjectId(userId)
    })
      .populate(this.populateUser)
      .populate(this.populateWorkshop)
      .populate(this.populateInvitedBy)
      .populate(this.populateRemovedBy);
  }

  async findActive(workshopId: string, userId: string): Promise<IMembership | null> {
    if (!Types.ObjectId.isValid(workshopId) || !Types.ObjectId.isValid(userId)) return null;
    return await Membership.findOne({
      workshop: new Types.ObjectId(workshopId),
      user: new Types.ObjectId(userId),
      state: MembershipState.ACTIVE
    })
      .populate(this.populateUser)
      .populate(this.populateWorkshop)
      .populate(this.populateInvitedBy)
      .populate(this.populateRemovedBy);
  }

  async findPendingByWorkshop(workshopId: string): Promise<IMembership[]> {
    if (!Types.ObjectId.isValid(workshopId)) return [];
    return await Membership.find({
      workshop: new Types.ObjectId(workshopId),
      state: MembershipState.PENDING
    })
      .populate(this.populateUser)
      .populate(this.populateInvitedBy)
      .sort({ createdAt: -1 });
  }

  async updateState(
    membershipId: string,
    newState: MembershipState,
    actorId?: string
  ): Promise<IMembership> {
    const updateData: any = { state: newState };

    if (newState === MembershipState.ACTIVE) {
      updateData.joinedAt = new Date();
    } else if (newState === MembershipState.REMOVED) {
      updateData.removedAt = new Date();
      if (actorId && Types.ObjectId.isValid(actorId)) {
        updateData.removedBy = new Types.ObjectId(actorId);
      }
    }

    const membership = await Membership.findByIdAndUpdate(
      membershipId,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate(this.populateUser)
      .populate(this.populateWorkshop)
      .populate(this.populateInvitedBy)
      .populate(this.populateRemovedBy);

    if (!membership) {
      throw new NotFoundError('Membership');
    }

    return membership;
  }

  async isActiveMember(workshopId: string, userId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(workshopId) || !Types.ObjectId.isValid(userId)) return false;
    const membership = await Membership.findOne({
      workshop: new Types.ObjectId(workshopId),
      user: new Types.ObjectId(userId),
      state: MembershipState.ACTIVE
    });
    return !!membership;
  }

  async countByWorkshop(workshopId: string, state?: MembershipState): Promise<number> {
    if (!Types.ObjectId.isValid(workshopId)) return 0;
    const query: any = { workshop: new Types.ObjectId(workshopId) };
    if (state) {
      query.state = state;
    }
    return await Membership.countDocuments(query);
  }

  async countByUser(userId: string, state?: MembershipState): Promise<number> {
    if (!Types.ObjectId.isValid(userId)) return 0;
    const query: any = { user: new Types.ObjectId(userId) };
    if (state) {
      query.state = state;
    }
    return await Membership.countDocuments(query);
  }

  async deleteByWorkshop(workshopId: string): Promise<void> {
    if (!Types.ObjectId.isValid(workshopId)) return;
    await Membership.deleteMany({ workshop: new Types.ObjectId(workshopId) });
  }

  async deleteByUser(workshopId: string, userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(workshopId) || !Types.ObjectId.isValid(userId)) return;
    await Membership.deleteMany({
      workshop: new Types.ObjectId(workshopId),
      user: new Types.ObjectId(userId)
    });
  }

  async getActiveMembers(workshopId: string): Promise<IMembership[]> {
    return await this.findByWorkshop(workshopId, MembershipState.ACTIVE);
  }

  async getPendingInvitations(workshopId: string): Promise<IMembership[]> {
    if (!Types.ObjectId.isValid(workshopId)) return [];
    return await Membership.find({
      workshop: new Types.ObjectId(workshopId),
      state: MembershipState.PENDING,
      source: MembershipSource.INVITATION
    })
      .populate(this.populateUser)
      .populate(this.populateInvitedBy)
      .sort({ createdAt: -1 });
  }

  async getPendingJoinRequests(workshopId: string): Promise<IMembership[]> {
    if (!Types.ObjectId.isValid(workshopId)) return [];
    return await Membership.find({
      workshop: new Types.ObjectId(workshopId),
      state: MembershipState.PENDING,
      source: MembershipSource.JOIN_REQUEST
    })
      .populate(this.populateUser)
      .sort({ createdAt: -1 });
  }

  async delete(membershipId: string): Promise<void> {
    if (!Types.ObjectId.isValid(membershipId)) return;
    await Membership.findByIdAndDelete(membershipId);
  }
}