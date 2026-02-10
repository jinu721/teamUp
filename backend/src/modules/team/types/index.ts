
import { Document, Types } from 'mongoose';

export enum MembershipState {
    PENDING = 'pending',
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    REJECTED = 'rejected',
    LEFT = 'left',
    REMOVED = 'removed'
}

export enum MembershipSource {
    INVITE = 'invite',
    INVITATION = 'invite',
    JOIN_REQUEST = 'join_request',
    ADDED = 'added',
    OPEN_ACCESS = 'open_access'
}

export interface IMembership extends Document {
    user: Types.ObjectId;
    team: Types.ObjectId;
    workshop: Types.ObjectId;
    state: MembershipState;
    source: MembershipSource;
    role: Types.ObjectId;
    invitedBy?: Types.ObjectId;
    removedAt?: Date;
    removedBy?: Types.ObjectId;
    joinedAt: Date;
    leftAt?: Date;
}

export interface ITeamRole {
    name: string;
    permissions: string[];
    members: Types.ObjectId[];
}

export interface ITeam extends Document {
    name: string;
    description?: string;
    workshop: Types.ObjectId;
    members: Types.ObjectId[];
    roles?: ITeamRole[];
    internalRoles?: ITeamRole[];
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateTeamDTO {
    name: string;
    description?: string;
    workshopId?: string;
}

export interface UpdateTeamDTO {
    name?: string;
    description?: string;
}

export interface CreateMembershipDTO {
    workshopId: string;
    userId: string;
    source: MembershipSource;
    invitedBy?: string;
    state?: MembershipState;
}
