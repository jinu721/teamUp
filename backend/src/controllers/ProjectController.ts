import { Response, NextFunction } from 'express';
import { ProjectService } from '../services/ProjectService';
import { AuthRequest, ProjectCategory } from '../types';
import { ValidationError } from '../utils/errorHandler';

export class ProjectController {
  private projectService: ProjectService;

  constructor(projectService: ProjectService) {
    this.projectService = projectService;
  }

  createProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { title, description, category, startDate, endDate } = req.body;

      if (!title || !description || !category || !startDate) {
        throw new ValidationError('Title, description, category, and start date are required');
      }

      const project = await this.projectService.createProject(
        userId,
        title,
        description,
        category as ProjectCategory,
        new Date(startDate),
        endDate ? new Date(endDate) : undefined
      );

      res.status(201).json({
        success: true,
        data: project
      });
    } catch (error) {
      next(error);
    }
  };

  getProjects = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const projects = await this.projectService.getUserProjects(userId);

      res.status(200).json({
        success: true,
        data: projects
      });
    } catch (error) {
      next(error);
    }
  };

  getProjectById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const project = await this.projectService.getProjectById(id, userId);

      res.status(200).json({
        success: true,
        data: project
      });
    } catch (error) {
      next(error);
    }
  };

  updateProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const updates = req.body;

      const project = await this.projectService.updateProject(id, userId, updates);

      res.status(200).json({
        success: true,
        data: project
      });
    } catch (error) {
      next(error);
    }
  };

  deleteProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await this.projectService.deleteProject(id, userId);

      res.status(200).json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  inviteTeamMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { email } = req.body;

      if (!email) {
        throw new ValidationError('Email is required');
      }

      const project = await this.projectService.inviteTeamMember(id, userId, email);

      res.status(200).json({
        success: true,
        data: project
      });
    } catch (error) {
      next(error);
    }
  };
}
