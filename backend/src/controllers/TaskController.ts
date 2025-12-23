import { Response, NextFunction } from 'express';
import { TaskService } from '../services/TaskService';
import { AuthRequest, TaskStatus } from '../types';
import { ValidationError } from '../utils/errorHandler';

export class TaskController {
  private taskService: TaskService;

  constructor(taskService: TaskService) {
    this.taskService = taskService;
  }

  createTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { projectId } = req.params;
      const { title, description, assignedTo, dueDate } = req.body;

      if (!title) {
        throw new ValidationError('Task title is required');
      }

      const task = await this.taskService.createTask(
        projectId,
        userId,
        title,
        description,
        assignedTo,
        dueDate ? new Date(dueDate) : undefined
      );

      res.status(201).json({
        success: true,
        data: task
      });
    } catch (error) {
      next(error);
    }
  };

  getProjectTasks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { projectId } = req.params;

      const tasks = await this.taskService.getProjectTasks(projectId, userId);

      res.status(200).json({
        success: true,
        data: tasks
      });
    } catch (error) {
      next(error);
    }
  };

  updateTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const updates = req.body;

      const task = await this.taskService.updateTask(id, userId, updates);

      res.status(200).json({
        success: true,
        data: task
      });
    } catch (error) {
      next(error);
    }
  };

  updateTaskStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        throw new ValidationError('Status is required');
      }

      const task = await this.taskService.updateTaskStatus(id, userId, status as TaskStatus);

      res.status(200).json({
        success: true,
        data: task
      });
    } catch (error) {
      next(error);
    }
  };

  deleteTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await this.taskService.deleteTask(id, userId);

      res.status(200).json({
        success: true,
        message: 'Task deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };
}
