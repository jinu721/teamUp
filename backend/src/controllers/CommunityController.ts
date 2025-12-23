import { Response, NextFunction } from 'express';
import { CommunityService } from '../services/CommunityService';
import { AuthRequest } from '../types';
import { ValidationError } from '../utils/errorHandler';

export class CommunityController {
  private communityService: CommunityService;

  constructor(communityService: CommunityService) {
    this.communityService = communityService;
  }

  createCommunityProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { title, description, tags, requiredSkills } = req.body;

      if (!title || !description) {
        throw new ValidationError('Title and description are required');
      }

      const project = await this.communityService.createCommunityProject(
        userId,
        title,
        description,
        tags || [],
        requiredSkills || []
      );

      res.status(201).json({
        success: true,
        data: project
      });
    } catch (error) {
      next(error);
    }
  };

  getCommunityProjects = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = parseInt(req.query.skip as string) || 0;

      const projects = await this.communityService.getCommunityProjects(limit, skip);

      res.status(200).json({
        success: true,
        data: projects
      });
    } catch (error) {
      next(error);
    }
  };

  getCommunityProjectById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const project = await this.communityService.getCommunityProjectById(id);

      res.status(200).json({
        success: true,
        data: project
      });
    } catch (error) {
      next(error);
    }
  };

  likeProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const project = await this.communityService.likeProject(id, userId);

      res.status(200).json({
        success: true,
        data: project
      });
    } catch (error) {
      next(error);
    }
  };

  commentOnProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { content } = req.body;

      if (!content) {
        throw new ValidationError('Comment content is required');
      }

      const project = await this.communityService.commentOnProject(id, userId, content);

      res.status(200).json({
        success: true,
        data: project
      });
    } catch (error) {
      next(error);
    }
  };

  requestToJoin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const project = await this.communityService.requestToJoin(id, userId);

      res.status(200).json({
        success: true,
        data: project
      });
    } catch (error) {
      next(error);
    }
  };
}
