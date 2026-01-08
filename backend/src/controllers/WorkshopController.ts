import { Request, Response, NextFunction } from 'express';
import { WorkshopService } from '../services/WorkshopService';
import { AuthRequest, WorkshopVisibility } from '../types';

/**
 * Workshop Controller
 * Handles HTTP requests for workshop management
 */
export class WorkshopController {
  private workshopService: WorkshopService;

  constructor() {
    this.workshopService = new WorkshopService();
  }

  /**
   * Set socket service for real-time updates
   */
  setSocketService(socketService: any): void {
    this.workshopService.setSocketService(socketService);
  }

  /**
   * Create a new workshop
   * POST /workshops
   */
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

  /**
   * Get user's workshops
   * GET /workshops/my-workshops
   */
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

  /**
   * Get public workshops for discovery
   * GET /workshops/public
   */
  getPublicWorkshops = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { search, category, tags, sort, page = 1, limit = 20 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);
      const currentUserId = (req as any).user?.id;

      const result = await this.workshopService.getPublicWorkshops({
        search: search as string,
        category: category as string,
        tags: tags ? (Array.isArray(tags) ? tags as string[] : [tags as string]) : undefined,
        limit: Number(limit),
        skip,
        sort: sort as string
      }, currentUserId);

      res.json({
        success: true,
        data: result.workshops,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: result.total,
          pages: Math.ceil(result.total / Number(limit))
        },
        message: 'Public workshops retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get a specific workshop
   * GET /workshops/:workshopId
   */
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

  /**
   * Update a workshop
   * PUT /workshops/:workshopId
   */
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

  /**
   * Delete a workshop
   * DELETE /workshops/:workshopId
   */
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

  /**
   * Get workshop members
   * GET /workshops/:workshopId/members
   */
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

  /**
   * Get pending join requests
   * GET /workshops/:workshopId/pending-requests
   */
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

  /**
   * Invite a member
   * POST /workshops/:workshopId/invite
   */
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

      // Look up user by email
      const User = require('../models/User').User;
      const invitedUser = await User.findOne({ email: email.toLowerCase() });

      console.log("invitedUser", invitedUser);

      if (!invitedUser) {
        res.status(404).json({
          success: false,
          message: 'User with this email not found'
        });
        return;
      }

      const membership = await this.workshopService.inviteMember(workshopId, actorId, invitedUser._id.toString(), roleId);

      console.log("membership", membership);

      res.status(201).json({
        success: true,
        data: membership,
        message: 'Member invited successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle join request
   * POST /workshops/:workshopId/join
   */
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

  /**
   * Approve join request
   * POST /workshops/:workshopId/approve/:membershipId
   */
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

  /**
   * Reject join request
   * POST /workshops/:workshopId/reject/:membershipId
   */
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

  /**
   * Revoke membership
   * DELETE /workshops/:workshopId/members/:userId
   */
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

  /**
   * Leave workshop
   * POST /workshops/:workshopId/leave
   */
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

  /**
   * Assign manager
   * POST /workshops/:workshopId/managers/:managerId
   */
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

  /**
   * Remove manager
   * DELETE /workshops/:workshopId/managers/:managerId
   */
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

  /**
   * Upvote a workshop
   * POST /workshops/:workshopId/upvote
   */
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

  /**
   * Downvote a workshop
   * POST /workshops/:workshopId/downvote
   */
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
  /**
   * Check permission for current user
   * GET /workshops/:workshopId/permissions/check
   */
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