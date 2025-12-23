import { Task } from '../models/Task';
import { ITask, TaskStatus } from '../types';
import { Types } from 'mongoose';

export class TaskRepository {
  async create(taskData: Partial<ITask>): Promise<ITask> {
    const task = new Task(taskData);
    return await task.save();
  }

  async findById(id: string): Promise<ITask | null> {
    return await Task.findById(id)
      .populate('assignedTo', 'name email profilePhoto')
      .populate('createdBy', 'name email profilePhoto');
  }

  async findByProjectId(projectId: string): Promise<ITask[]> {
    return await Task.find({ project: new Types.ObjectId(projectId) })
      .populate('assignedTo', 'name email profilePhoto')
      .populate('createdBy', 'name email profilePhoto')
      .sort({ createdAt: -1 });
  }

  async findByStatus(projectId: string, status: TaskStatus): Promise<ITask[]> {
    return await Task.find({ 
      project: new Types.ObjectId(projectId),
      status 
    })
      .populate('assignedTo', 'name email profilePhoto')
      .populate('createdBy', 'name email profilePhoto')
      .sort({ createdAt: -1 });
  }

  async update(id: string, updates: Partial<ITask>): Promise<ITask | null> {
    return await Task.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'name email profilePhoto')
      .populate('createdBy', 'name email profilePhoto');
  }

  async delete(id: string): Promise<ITask | null> {
    return await Task.findByIdAndDelete(id);
  }

  async updateStatus(id: string, status: TaskStatus): Promise<ITask | null> {
    return await Task.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    )
      .populate('assignedTo', 'name email profilePhoto')
      .populate('createdBy', 'name email profilePhoto');
  }

  async assignTask(id: string, userId: string): Promise<ITask | null> {
    return await Task.findByIdAndUpdate(
      id,
      { $set: { assignedTo: new Types.ObjectId(userId) } },
      { new: true }
    )
      .populate('assignedTo', 'name email profilePhoto')
      .populate('createdBy', 'name email profilePhoto');
  }

  async findByAssignee(userId: string): Promise<ITask[]> {
    return await Task.find({ assignedTo: new Types.ObjectId(userId) })
      .populate('project', 'title')
      .populate('createdBy', 'name email profilePhoto')
      .sort({ dueDate: 1 });
  }
}
