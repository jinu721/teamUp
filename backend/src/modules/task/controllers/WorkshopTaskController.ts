import { Response, NextFunction } from 'express';
import { IWorkshopTaskService } from '../interfaces/IWorkshopTaskService';
import { AuthRequest } from '../../../shared/types/index';
import { ISocketService } from '../../../shared/interfaces/ISocketService';

export class WorkshopTaskController {
  constructor(private taskService: IWorkshopTaskService) { }

  setSocketService(socketService: ISocketService): void {
    (this.taskService as any).setSocketService?.(socketService);
  }

  createTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId } = req.params;
      const userId = req.user!.id;

      const task = await this.taskService.createTask(projectId, userId, req.body);

      res.status(201).json({
        success: true,
        data: task,
        message: 'Task created successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  addComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { taskId } = req.params;
      const { content, mentions } = req.body;
      const userId = req.user!.id;

      const task = await this.taskService.addComment(taskId, userId, content, mentions);

      res.json({
        success: true,
        data: task,
        message: 'Comment added successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  addAttachment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { taskId } = req.params;
      const userId = req.user!.id;
      const fileData = req.body;

      const task = await this.taskService.addAttachment(taskId, userId, fileData);

      res.json({
        success: true,
        data: task,
        message: 'Attachment added successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  getProjectTasks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId } = req.params;
      const userId = req.user!.id;

      const tasks = await this.taskService.getProjectTasks(projectId, userId);

      res.json({
        success: true,
        data: tasks,
        message: 'Tasks retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  getProjectTaskBoard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId } = req.params;
      const userId = req.user!.id;

      const board = await this.taskService.getProjectTaskBoard(projectId, userId);

      res.json({
        success: true,
        data: board,
        message: 'Task board retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  getTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { taskId } = req.params;
      const userId = req.user!.id;

      const task = await this.taskService.getTaskById(taskId, userId);

      res.json({
        success: true,
        data: task,
        message: 'Task retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  updateTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { taskId } = req.params;
      const userId = req.user!.id;
      const updates = req.body;

      const task = await this.taskService.updateTask(taskId, userId, updates);

      res.json({
        success: true,
        data: task,
        message: 'Task updated successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  updateTaskStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { taskId } = req.params;
      const { status } = req.body;
      const userId = req.user!.id;

      const task = await this.taskService.updateTaskStatus(taskId, userId, status);

      res.json({
        success: true,
        data: task,
        message: 'Task status updated successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  deleteTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { taskId } = req.params;
      const userId = req.user!.id;

      await this.taskService.deleteTask(taskId, userId);

      res.json({
        success: true,
        message: 'Task deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  assignTeam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { taskId } = req.params;
      const { teamId } = req.body;
      const userId = req.user!.id;

      const task = await this.taskService.assignTeamToTask(taskId, userId, teamId);

      res.json({
        success: true,
        data: task,
        message: 'Team assigned to task successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  assignIndividual = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { taskId } = req.params;
      const { userId: individualId } = req.body;
      const userId = req.user!.id;

      const task = await this.taskService.assignIndividualToTask(taskId, userId, individualId);

      res.json({
        success: true,
        data: task,
        message: 'Individual assigned to task successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  getMyTasks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;

      const tasks = await this.taskService.getUserTasks(userId);

      res.json({
        success: true,
        data: tasks,
        message: 'User tasks retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  getTeamTasks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { teamId } = req.params;
      const userId = req.user!.id;

      const tasks = await this.taskService.getTeamTasks(teamId, userId);

      res.json({
        success: true,
        data: tasks,
        message: 'Team tasks retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  getTaskActivities = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { taskId } = req.params;
      const userId = req.user!.id;

      const activities = await this.taskService.getTaskActivities(taskId, userId);

      res.json({
        success: true,
        data: activities,
        message: 'Task activities retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  };
}