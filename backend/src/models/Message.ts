import mongoose, { Schema } from 'mongoose';
import { IMessage } from '../types';

const messageSchema = new Schema<IMessage>(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters']
    },
    attachments: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

messageSchema.index({ project: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);
