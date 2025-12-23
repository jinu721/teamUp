import { Message } from '../models/Message';
import { IMessage } from '../types';
import { Types } from 'mongoose';

export class MessageRepository {
  async create(messageData: Partial<IMessage>): Promise<IMessage> {
    const message = new Message(messageData);
    const savedMessage = await message.save();
    return await this.findById(savedMessage._id.toString()) as IMessage;
  }

  async findById(id: string): Promise<IMessage | null> {
    return await Message.findById(id)
      .populate('sender', 'name email profilePhoto');
  }

  async findByProjectId(projectId: string, limit: number = 50): Promise<IMessage[]> {
    return await Message.find({ project: new Types.ObjectId(projectId) })
      .populate('sender', 'name email profilePhoto')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async findRecentMessages(projectId: string, since: Date): Promise<IMessage[]> {
    return await Message.find({
      project: new Types.ObjectId(projectId),
      createdAt: { $gte: since }
    })
      .populate('sender', 'name email profilePhoto')
      .sort({ createdAt: 1 });
  }

  async deleteByProjectId(projectId: string): Promise<void> {
    await Message.deleteMany({ project: new Types.ObjectId(projectId) });
  }
}
