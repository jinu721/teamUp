import { Request, Response, NextFunction } from 'express';
import { IWorkshopService } from '../interfaces/IWorkshopService';
import { AuthRequest } from '../../../shared/types/index';
import { WorkshopVisibility, IWorkshop, CreateWorkshopDTO, UpdateWorkshopDTO, ProjectCategory } from '../types/index';
import { ISocketService } from '../../../shared/interfaces/ISocketService';

export class WorkshopController {
  constructor(private workshopService: IWorkshopService) { }

  setSocketService(socketService: ISocketService): void {
    (this.workshopService as any).setSocketService?.(socketService);
  }

  createWorkshop = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { name, description, visibility, category, tags, requiredSkills, settings } = req.body;

      const workshop = await this.workshopService.createWorkshop(userId, {
        name,
        description,
        visibility: visibility as WorkshopVisibility,
        category,
        tags,
        requiredSkills,
        settings
      });

      res.status(201).json({
        success: true,
        data: workshop,
        message: 'Workshop created successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  getUserWorkshops = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;

      const workshops = await this.workshopService.getUserWorkshops(userId);

      res.json({
        success: true,
        data: workshops,
        message: 'Workshops retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  getPublicWorkshops = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { search, category, tags, sort, page = 1, limit = 20 } = req.query;
      const currentUserId = (req as any).user?.id;

      const result = await this.workshopService.getPublicWorkshops({
        search: search as string,
        category: category as string,
        tags: tags ? (Array.isArray(tags) ? tags as string[] : [tags as string]) : undefined,
        limit: Number(limit),
        page: Number(page),
        sort: sort as string
      }, currentUserId);

      res.json({
        success: true,
        data: result.workshops,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: result.total,
          pages: result.pages
        },
        message: 'Public workshops retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  getWorkshop = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workshopId } = req.params;

      const workshop = await this.workshopService.getWorkshop(workshopId);

      res.json({
        success: true,
        data: workshop,
        message: 'Workshop retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  updateWorkshop = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workshopId } = req.params;
      const userId = req.user!.id;
      const updates = req.body;

      const workshop = await this.workshopService.updateWorkshop(workshopId, userId, updates);

      res.json({
        success: true,
        data: workshop,
        message: 'Workshop updated successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  deleteWorkshop = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workshopId } = req.params;
      const userId = req.user!.id;

      await this.workshopService.deleteWorkshop(workshopId, userId);

      res.json({
        success: true,
        message: 'Workshop deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  getMembers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workshopId } = req.params;
      const { state } = req.query;

      const members = await this.workshopService.getMembers(workshopId, state as any);

      res.json({
        success: true,
        data: members,
        message: 'Members retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  getPendingRequests = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workshopId } = req.params;

      const requests = await this.workshopService.getPendingRequests(workshopId);

      res.json({
        success: true,
        data: requests,
        message: 'Pending requests retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  inviteMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workshopId } = req.params;
      const { email, roleId } = req.body;
      const actorId = req.user!.id;

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required'
        });
        return;
      }

      await this.workshopService.inviteMember(workshopId, actorId, email, roleId);

      res.status(201).json({
        success: true,
        message: 'Member invited successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  handleJoinRequest = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workshopId } = req.params;
      const userId = req.user!.id;

      const membership = await this.workshopService.handleJoinRequest(workshopId, userId);

      res.status(201).json({
        success: true,
        data: membership,
        message: membership.state === 'active' ? 'Joined workshop successfully' : 'Join request submitted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  approveJoinRequest = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workshopId, membershipId } = req.params;
      const actorId = req.user!.id;

      const membership = await this.workshopService.approveJoinRequest(workshopId, actorId, membershipId);

      res.json({
        success: true,
        data: membership,
        message: 'Join request approved successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  rejectJoinRequest = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workshopId, membershipId } = req.params;
      const { reason } = req.body;
      const actorId = req.user!.id;

      const membership = await this.workshopService.rejectJoinRequest(workshopId, actorId, membershipId, reason);

      res.json({
        success: true,
        data: membership,
        message: 'Join request rejected successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  revokeMembership = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workshopId, userId } = req.params;
      const { reason } = req.body;
      const actorId = req.user!.id;

      const membership = await this.workshopService.revokeMembership(workshopId, actorId, userId, reason);

      res.json({
        success: true,
        data: membership,
        message: 'Membership revoked successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  leaveWorkshop = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workshopId } = req.params;
      const userId = req.user!.id;

      await this.workshopService.handleMemberLeave(workshopId, userId);

      res.json({
        success: true,
        message: 'Left workshop successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  assignManager = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workshopId, managerId } = req.params;
      const actorId = req.user!.id;

      const workshop = await this.workshopService.assignManager(workshopId, actorId, managerId);

      res.json({
        success: true,
        data: workshop,
        message: 'Manager assigned successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  removeManager = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workshopId, managerId } = req.params;
      const actorId = req.user!.id;

      const workshop = await this.workshopService.removeManager(workshopId, actorId, managerId);

      res.json({
        success: true,
        data: workshop,
        message: 'Manager removed successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  upvoteWorkshop = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workshopId } = req.params;
      const userId = req.user!.id;

      const workshop = await this.workshopService.upvoteWorkshop(userId, workshopId);

      res.json({
        success: true,
        data: workshop,
        message: 'Workshop upvoted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  downvoteWorkshop = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workshopId } = req.params;
      const userId = req.user!.id;

      const workshop = await this.workshopService.downvoteWorkshop(userId, workshopId);

      res.json({
        success: true,
        data: workshop,
        message: 'Workshop downvoted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  checkPermission = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workshopId } = req.params;
      const { action, resource, projectId, teamId } = req.query;
      const userId = req.user!.id;

      if (!action || !resource) {
        res.status(400).json({ success: false, message: 'Action and resource are required' });
        return;
      }

      const result = await this.workshopService.checkPermission(
        userId,
        workshopId,
        action as string,
        resource as string,
        {
          projectId: projectId as string,
          teamId: teamId as string
        }
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };
}