import { Response, NextFunction } from 'express';
import { TeamService } from '../services/TeamService';
import { AuthRequest } from '../types';
import { SocketService } from '../services/SocketService';

/**
 * Team Controller
 * Handles HTTP requests for team management
 */
export class TeamController {
  private teamService: TeamService;
  private socketService: SocketService | null = null;

  constructor() {
    this.teamService = new TeamService();
  }

  /**
   * Set socket service for real-time updates
   */
  setSocketService(socketService: SocketService): void {
    this.socketService = socketService;
    this.teamService.setSocketService(socketService);
  }

  /**
   * Create a new team
   * POST /workshops/:workshopId/teams
   */
  createTeam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workshopId } = req.params;
      const userId = req.user!.id;
      const { name, description } = req.body;

      const team = await this.teamService.createTeam(workshopId, userId, {
        name,
        description
      });

      // Emit real-time update
      if (this.socketService) {
        this.socketService.emitToWorkshop(workshopId, 'team:created', team);
      }

      res.status(201).json({
        success: true,
        data: team,
        message: 'Team created successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all teams in a workshop
   * GET /workshops/:workshopId/teams
   */
  getWorkshopTeams = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workshopId } = req.params;

      const teams = await this.teamService.getWorkshopTeams(workshopId);

      res.json({
        success: true,
        data: teams,
        message: 'Teams retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get a specific team
   * GET /workshops/:workshopId/teams/:teamId
   */
  getTeam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { teamId } = req.params;

      const team = await this.teamService.getTeam(teamId);

      res.json({
        success: true,
        data: team,
        message: 'Team retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update a team
   * PUT /workshops/:workshopId/teams/:teamId
   */
  updateTeam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { teamId } = req.params;
      const userId = req.user!.id;
      const updates = req.body;

      const team = await this.teamService.updateTeam(teamId, userId, updates);

      // Emit real-time update
      if (this.socketService) {
        const workshopId = (team as any).workshop?._id || (team as any).workshop;
        this.socketService.emitToWorkshop(workshopId.toString(), 'team:updated', team);
      }

      res.json({
        success: true,
        data: team,
        message: 'Team updated successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a team
   * DELETE /workshops/:workshopId/teams/:teamId
   */
  deleteTeam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { teamId } = req.params;
      const userId = req.user!.id;

      await this.teamService.deleteTeam(teamId, userId);

      // Emit real-time update
      if (this.socketService) {
        const { workshopId } = req.params;
        this.socketService.emitToWorkshop(workshopId, 'team:deleted', { teamId });
      }

      res.json({
        success: true,
        message: 'Team deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Add member to team
   * POST /workshops/:workshopId/teams/:teamId/members/:userId
   */
  addMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { teamId, userId: memberId } = req.params;
      const actorId = req.user!.id;

      const team = await this.teamService.addMemberToTeam(teamId, actorId, memberId);

      // Emit real-time update
      if (this.socketService) {
        const workshopId = (team as any).workshop?._id || (team as any).workshop;
        this.socketService.emitToWorkshop(workshopId.toString(), 'team:member:added', team);
        this.socketService.emitToTeam(teamId, 'team:updated', team);
      }

      res.json({
        success: true,
        data: team,
        message: 'Member added to team successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Remove member from team
   * DELETE /workshops/:workshopId/teams/:teamId/members/:userId
   */
  removeMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { teamId, userId: memberId } = req.params;
      const actorId = req.user!.id;

      const team = await this.teamService.removeMemberFromTeam(teamId, actorId, memberId);

      // Emit real-time update
      if (this.socketService) {
        const workshopId = (team as any).workshop?._id || (team as any).workshop;
        this.socketService.emitToWorkshop(workshopId.toString(), 'team:member:removed', team);
        this.socketService.emitToTeam(teamId, 'team:updated', team);
      }

      res.json({
        success: true,
        data: team,
        message: 'Member removed from team successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Assign internal role to team member
   * POST /workshops/:workshopId/teams/:teamId/roles/:roleName/members/:userId
   */
  assignInternalRole = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { teamId, roleName, userId: memberId } = req.params;
      const actorId = req.user!.id;

      const team = await this.teamService.assignInternalRole(teamId, actorId, memberId, roleName);

      // Emit real-time update
      if (this.socketService) {
        this.socketService.emitToTeam(teamId, 'team:role:assigned', team);
      }

      res.json({
        success: true,
        data: team,
        message: 'Internal role assigned successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Remove internal role from team member
   * DELETE /workshops/:workshopId/teams/:teamId/roles/:roleName/members/:userId
   */
  removeInternalRole = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { teamId, roleName, userId: memberId } = req.params;
      const actorId = req.user!.id;

      const team = await this.teamService.removeInternalRole(teamId, actorId, memberId, roleName);

      // Emit real-time update
      if (this.socketService) {
        this.socketService.emitToTeam(teamId, 'team:role:removed', team);
      }

      res.json({
        success: true,
        data: team,
        message: 'Internal role removed successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user's teams in a workshop
   * GET /workshops/:workshopId/my-teams
   */
  getUserTeams = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workshopId } = req.params;
      const userId = req.user!.id;

      const teams = await this.teamService.getUserTeamsInWorkshop(workshopId, userId);

      res.json({
        success: true,
        data: teams,
        message: 'User teams retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  };
}