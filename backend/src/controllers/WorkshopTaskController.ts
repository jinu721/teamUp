import { Response, NextFunction } from 'express';
import { WorkshopTaskService } from '../services/WorkshopTaskService';
import { AuthRequest } from '../types';
import { SocketService } from '../services/SocketService';

/**
 * Workshop Task Controller
 * Handles HTTP requests for workshop-aware task management
 */
export class WorkshopTaskController {
  private taskService: WorkshopTaskService;

  constructor() {
    this.taskService = new WorkshopTaskService();
  }

  /**
   * Set socket service for real-time updates
   */
  setSocketService(socketService: SocketService): void {
    this.taskService.setSocketService(socketService);
  }

  /**
   * Create a new task in a project
   * POST /workshops/:workshopId/projects/:projectId/tasks
   */
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

  /**
   * Add a comment to a task
   * POST /workshops/:workshopId/projects/:projectId/tasks/:taskId/comments
   */
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

  /**
   * Add an attachment to a task
   * POST /workshops/:workshopId/projects/:projectId/tasks/:taskId/attachments
   */
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

  /**
   * Get all tasks in a project
   * GET /workshops/:workshopId/projects/:projectId/tasks
   */
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

  /**
   * Get project task board (grouped by status)
   * GET /workshops/:workshopId/projects/:projectId/tasks/board
   */
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

  /**
   * Get a specific task
   * GET /workshops/:workshopId/projects/:projectId/tasks/:taskId
   */
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

  /**
   * Update a task
   * PUT /workshops/:workshopId/projects/:projectId/tasks/:taskId
   */
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

  /**
   * Update task status (for drag-and-drop)
   * PUT /workshops/:workshopId/projects/:projectId/tasks/:taskId/status
   */
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

  /**
   * Delete a task
   * DELETE /workshops/:workshopId/projects/:projectId/tasks/:taskId
   */
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

  /**
   * Assign team to task
   * POST /workshops/:workshopId/projects/:projectId/tasks/:taskId/teams/:teamId
   */
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

  /**
   * Assign individual to task
   * POST /workshops/:workshopId/projects/:projectId/tasks/:taskId/individuals/:individualId
   */
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

  /**
   * Get tasks assigned to current user
   * GET /workshops/:workshopId/my-tasks
   */
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

  /**
   * Get tasks assigned to a team
   * GET /workshops/:workshopId/teams/:teamId/tasks
   */
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

  /**
   * Get task activities
   * GET /workshops/:workshopId/projects/:projectId/tasks/:taskId/activity
   */
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