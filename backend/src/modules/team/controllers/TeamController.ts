import { Response, NextFunction } from 'express';
import { ITeamService } from '../interfaces/ITeamService';
import { AuthRequest } from '../../../shared/types/index';
import { ITeam, CreateTeamDTO, UpdateTeamDTO } from '../types/index';
import { ISocketService } from '../../../shared/interfaces/ISocketService';

export class TeamController {
  private socketService: ISocketService | null = null;

  constructor(private teamService: ITeamService) { }

  setSocketService(socketService: ISocketService): void {
    this.socketService = socketService;
    this.teamService.setSocketService(socketService);
  }

  createTeam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workshopId } = req.params;
      const userId = req.user!.id;
      const { name, description } = req.body;

      const team = await this.teamService.createTeam(workshopId, userId, {
        name,
        description
      });

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

  updateTeam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { teamId } = req.params;
      const userId = req.user!.id;
      const updates = req.body;

      const team = await this.teamService.updateTeam(teamId, userId, updates);

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

  deleteTeam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { teamId } = req.params;
      const userId = req.user!.id;

      await this.teamService.deleteTeam(teamId, userId);

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

  addMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { teamId, userId: memberId } = req.params;
      const actorId = req.user!.id;

      const team = await this.teamService.addMemberToTeam(teamId, actorId, memberId);

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

  removeMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { teamId, userId: memberId } = req.params;
      const actorId = req.user!.id;

      const team = await this.teamService.removeMemberFromTeam(teamId, actorId, memberId);

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

  assignInternalRole = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { teamId, roleName, userId: memberId } = req.params;
      const actorId = req.user!.id;

      const team = await this.teamService.assignInternalRole(teamId, actorId, memberId, roleName);

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

  removeInternalRole = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { teamId, roleName, userId: memberId } = req.params;
      const actorId = req.user!.id;

      const team = await this.teamService.removeInternalRole(teamId, actorId, memberId, roleName);

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