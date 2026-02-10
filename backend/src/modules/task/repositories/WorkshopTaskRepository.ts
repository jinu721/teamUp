import { WorkshopTask } from '../models/WorkshopTask';
import { IWorkshopTask, CreateWorkshopTaskDTO, UpdateWorkshopTaskDTO, ITaskAttachment } from '../../../shared/types/index';
import { Types } from 'mongoose';
import { NotFoundError } from '../../../shared/utils/errors';

export interface TasksByStatus {
  [status: string]: IWorkshopTask[];
}

export class WorkshopTaskRepository {
  private readonly populateAssignedTeams = { path: 'assignedTeams', select: 'name description' };
  private readonly populatePeople = [
    { path: 'primaryOwner', select: 'name email profilePhoto' },
    { path: 'assignedIndividuals', select: 'name email profilePhoto' },
    { path: 'contributors', select: 'name email profilePhoto' },
    { path: 'watchers', select: 'name email profilePhoto' },
    { path: 'createdBy', select: 'name email profilePhoto' }
  ];
  private readonly populateProject = { path: 'project', select: 'name workshop' };
  private readonly populateHierarchy = [
    { path: 'parentTask', select: 'title status' },
    { path: 'childTasks', select: 'title status' },
    { path: 'blockedBy', select: 'title status' },
    { path: 'blocking', select: 'title status' }
  ];
  private readonly populateCollab = [
    { path: 'comments.user', select: 'name profilePhoto' },
    { path: 'attachments.uploadedBy', select: 'name profilePhoto' }
  ];

  async create(workshopId: string, projectId: string, taskData: CreateWorkshopTaskDTO, createdBy: string): Promise<IWorkshopTask> {
    const task = new WorkshopTask({
      ...taskData,
      workshop: new Types.ObjectId(workshopId),
      project: new Types.ObjectId(projectId),
      createdBy: new Types.ObjectId(createdBy),

      parentTask: taskData.parentTask ? new Types.ObjectId(taskData.parentTask) : undefined,
      primaryOwner: taskData.primaryOwner ? new Types.ObjectId(taskData.primaryOwner) : undefined,
      contributors: taskData.contributors?.map(id => new Types.ObjectId(id)) || [],
      watchers: taskData.watchers?.map(id => new Types.ObjectId(id)) || [],
      assignedTeams: taskData.assignedTeams?.map(id => new Types.ObjectId(id)) || [],
      assignedIndividuals: taskData.assignedIndividuals?.map(id => new Types.ObjectId(id)) || [],

      statusHistory: [{
        status: 'todo',
        changedBy: new Types.ObjectId(createdBy),
        changedAt: new Date(),
        comment: 'Task created'
      }],
      activityHistory: [{
        user: new Types.ObjectId(createdBy),
        action: 'created',
        changes: {},
        timestamp: new Date()
      }]
    });

    const saved = await task.save();

    if (taskData.parentTask) {
      await WorkshopTask.findByIdAndUpdate(taskData.parentTask, {
        $addToSet: { childTasks: saved._id }
      });
    }

    return await this.findById(saved._id.toString()) as IWorkshopTask;
  }

  async findById(id: string): Promise<IWorkshopTask | null> {
    return await WorkshopTask.findById(id)
      .populate(this.populateAssignedTeams)
      .populate(this.populatePeople)
      .populate(this.populateProject)
      .populate(this.populateHierarchy)
      .populate(this.populateCollab);
  }

  async findByProject(projectId: string): Promise<IWorkshopTask[]> {
    return await WorkshopTask.find({ project: new Types.ObjectId(projectId) })
      .populate(this.populateAssignedTeams)
      .populate(this.populatePeople)
      .sort({ createdAt: -1 });
  }

  async findByProjectGroupedByStatus(projectId: string): Promise<TasksByStatus> {
    const tasks = await this.findByProject(projectId);

    const grouped: TasksByStatus = {};
    for (const task of tasks) {
      if (!grouped[task.status]) {
        grouped[task.status] = [];
      }
      grouped[task.status].push(task);
    }

    return grouped;
  }

  async update(id: string, updates: UpdateWorkshopTaskDTO, updatedBy: string): Promise<IWorkshopTask> {
    const currentTask = await WorkshopTask.findById(id);
    if (!currentTask) {
      throw new NotFoundError('Task');
    }

    const formattedUpdates: any = { ...updates };
    if (updates.primaryOwner) formattedUpdates.primaryOwner = new Types.ObjectId(updates.primaryOwner);
    if (updates.contributors) formattedUpdates.contributors = updates.contributors.map(uid => new Types.ObjectId(uid));
    if (updates.watchers) formattedUpdates.watchers = updates.watchers.map(uid => new Types.ObjectId(uid));
    if (updates.assignedTeams) formattedUpdates.assignedTeams = updates.assignedTeams.map(tid => new Types.ObjectId(tid));
    if (updates.assignedIndividuals) formattedUpdates.assignedIndividuals = updates.assignedIndividuals.map(uid => new Types.ObjectId(uid));
    if (updates.blockedBy) formattedUpdates.blockedBy = updates.blockedBy.map(tid => new Types.ObjectId(tid));
    if (updates.blocking) formattedUpdates.blocking = updates.blocking.map(tid => new Types.ObjectId(tid));

    const changes: Record<string, { old: any; new: any }> = {};
    for (const [key, newValue] of Object.entries(updates)) {
      const oldValue = (currentTask as any)[key];
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[key] = { old: oldValue, new: newValue };
      }
    }

    if (updates.status && updates.status !== currentTask.status) {
      const lastHistoryEntry = currentTask.statusHistory[currentTask.statusHistory.length - 1];
      const duration = lastHistoryEntry
        ? new Date().getTime() - new Date(lastHistoryEntry.changedAt).getTime()
        : undefined;

      formattedUpdates.$push = {
        statusHistory: {
          status: updates.status,
          changedBy: new Types.ObjectId(updatedBy),
          changedAt: new Date(),
          duration
        }
      };

      if (updates.status === 'done' && !currentTask.completedAt) {
        formattedUpdates.completedAt = new Date();
      }
    }

    if (Object.keys(changes).length > 0) {
      if (!formattedUpdates.$push) formattedUpdates.$push = {};
      formattedUpdates.$push.activityHistory = {
        user: new Types.ObjectId(updatedBy),
        action: 'updated',
        changes,
        timestamp: new Date()
      };
    }

    const task = await WorkshopTask.findByIdAndUpdate(
      id,
      formattedUpdates,
      { new: true, runValidators: true }
    )
      .populate(this.populateAssignedTeams)
      .populate(this.populatePeople)
      .populate(this.populateProject)
      .populate(this.populateHierarchy)
      .populate(this.populateCollab);

    if (!task) {
      throw new NotFoundError('Task');
    }

    return task;
  }

  async updateStatus(id: string, status: string, updatedBy: string): Promise<IWorkshopTask> {
    return await this.update(id, { status }, updatedBy);
  }

  async addComment(taskId: string, userId: string, content: string, mentions: string[] = []): Promise<IWorkshopTask> {
    const task = await WorkshopTask.findByIdAndUpdate(
      taskId,
      {
        $push: {
          comments: {
            user: new Types.ObjectId(userId),
            content,
            mentions: mentions.map(m => new Types.ObjectId(m)),
            isEdited: false
          },
          activityHistory: {
            user: new Types.ObjectId(userId),
            action: 'comment_added',
            changes: { content: { old: null, new: content.substring(0, 50) + '...' } },
            timestamp: new Date()
          }
        }
      },
      { new: true }
    ).populate(this.populateCollab);

    if (!task) throw new NotFoundError('Task');
    return task;
  }

  async addAttachment(taskId: string, userId: string, fileData: Omit<ITaskAttachment, '_id' | 'uploadedBy' | 'uploadedAt'>): Promise<IWorkshopTask> {
    const task = await WorkshopTask.findByIdAndUpdate(
      taskId,
      {
        $push: {
          attachments: {
            ...fileData,
            uploadedBy: new Types.ObjectId(userId),
            uploadedAt: new Date()
          },
          activityHistory: {
            user: new Types.ObjectId(userId),
            action: 'attachment_added',
            changes: { fileName: { old: null, new: fileData.fileName } },
            timestamp: new Date()
          }
        }
      },
      { new: true }
    ).populate(this.populateCollab);

    if (!task) throw new NotFoundError('Task');
    return task;
  }

  async assignTeam(taskId: string, teamId: string, assignedBy: string): Promise<IWorkshopTask> {
    return await this.update(taskId, { assignedTeams: [teamId] }, assignedBy);
  }

  async assignIndividual(taskId: string, userId: string, assignedBy: string): Promise<IWorkshopTask> {
    return await this.update(taskId, { assignedIndividuals: [userId] }, assignedBy);
  }

  async delete(id: string, _deletedBy: string): Promise<void> {
    const task = await WorkshopTask.findById(id);
    if (!task) throw new NotFoundError('Task');

    if (task.parentTask) {
      await WorkshopTask.findByIdAndUpdate(task.parentTask, {
        $pull: { childTasks: task._id }
      });
    }

    if (task.childTasks.length > 0) {
      await WorkshopTask.updateMany(
        { _id: { $in: task.childTasks } },
        { $unset: { parentTask: "" } }
      );
    }

    await WorkshopTask.findByIdAndDelete(id);
  }

  async deleteByProject(projectId: string): Promise<void> {
    await WorkshopTask.deleteMany({ project: new Types.ObjectId(projectId) });
  }

  async findByAssignedUser(userId: string): Promise<IWorkshopTask[]> {
    return await WorkshopTask.find({
      $or: [
        { assignedIndividuals: new Types.ObjectId(userId) },
        { primaryOwner: new Types.ObjectId(userId) },
        { contributors: new Types.ObjectId(userId) }
      ]
    })
      .populate(this.populateAssignedTeams)
      .populate(this.populatePeople)
      .populate(this.populateProject)
      .sort({ updatedAt: -1 });
  }

  async findByAssignedTeam(teamId: string): Promise<IWorkshopTask[]> {
    return await WorkshopTask.find({
      assignedTeams: new Types.ObjectId(teamId)
    })
      .populate(this.populateAssignedTeams)
      .populate(this.populatePeople)
      .populate(this.populateProject)
      .sort({ updatedAt: -1 });
  }

  async countByProject(projectId: string): Promise<number> {
    return await WorkshopTask.countDocuments({ project: new Types.ObjectId(projectId) });
  }

  async countByStatus(projectId: string, status: string): Promise<number> {
    return await WorkshopTask.countDocuments({
      project: new Types.ObjectId(projectId),
      status
    });
  }
}