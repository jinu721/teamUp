import mongoose, { Schema } from 'mongoose';
import {
  IMembership,
  MembershipState,
  MembershipSource
} from '../types';

const membershipSchema = new Schema<IMembership>(
  {
    workshop: {
      type: Schema.Types.ObjectId,
      ref: 'Workshop',
      required: [true, 'Workshop reference is required']
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required']
    },
    state: {
      type: String,
      enum: {
        values: Object.values(MembershipState),
        message: `Invalid state. Must be one of: ${Object.values(MembershipState).join(', ')}`
      },
      required: [true, 'Membership state is required'],
      default: MembershipState.PENDING
    },
    source: {
      type: String,
      enum: {
        values: Object.values(MembershipSource),
        message: `Invalid source. Must be one of: ${Object.values(MembershipSource).join(', ')}`
      },
      required: [true, 'Membership source is required']
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date
    },
    removedAt: {
      type: Date
    },
    removedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

membershipSchema.index({ workshop: 1, user: 1 }, { unique: true });

membershipSchema.index({ workshop: 1, state: 1 });
membershipSchema.index({ user: 1, state: 1 });

export const Membership = mongoose.model<IMembership>('Membership', membershipSchema);