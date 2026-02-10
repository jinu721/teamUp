import { Response, NextFunction } from 'express';
import { WorkshopProjectService } from '../services/WorkshopProjectService';
import { AuthRequest } from '../../../shared/types/index';
import { SocketService } from '../../../socket/SocketService';

export class WorkshopProjectController {
  private socketService: SocketService | null = null;

  constructor(private projectService: WorkshopProjectService) { }

  setSocketService(socketService: SocketService): void {
    this.socketService = socketService;
  }

  createProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workshopId } = req.params;
      const userId = req.user!.id;
      const { name, description, settings } = req.body;

      const project = await this.projectService.createProject(workshopId, userId, {
        name,
        description,
        settings
      });

      if (this.socketService) {
        this.socketService.emitToWorkshop(workshopId, 'workshop:project:created', project);
      }

      res.status(201).json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  };

  getProjects = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workshopId } = req.params;
      const projects = await this.projectService.getWorkshopProjects(workshopId);
      res.json({ success: true, data: projects });
    } catch (error) {
      next(error);
    }
  };

  getAccessibleProjects = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workshopId } = req.params;
      const userId = req.user!.id;
      const projects = await this.projectService.getUserAccessibleProjects(workshopId, userId);
      res.json({ success: true, data: projects });
    } catch (error) {
      next(error);
    }
  };

  getProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId } = req.params;
      const project = await this.projectService.getProject(projectId);
      res.json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  };

  updateProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId } = req.params;
      const userId = req.user!.id;
      const project = await this.projectService.updateProject(projectId, userId, req.body);

      if (this.socketService) {
        const workshopId = (project as any).workshop?._id || project.workshop;
        this.socketService.emitToWorkshop(workshopId.toString(), 'workshop:project:updated', project);
      }

      res.json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  };

  deleteProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId, workshopId } = req.params;
      const userId = req.user!.id;
      await this.projectService.deleteProject(projectId, userId);

      if (this.socketService) {
        this.socketService.emitToWorkshop(workshopId, 'workshop:project:deleted', { projectId, workshopId });
      }

      res.json({ success: true, message: 'Project deleted' });
    } catch (error) {
      next(error);
    }
  };

  assignTeam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId } = req.params;
      const { teamId } = req.body;
      const userId = req.user!.id;

      if (!teamId) throw new Error('Team ID is required');

      const project = await this.projectService.assignTeamToProject(projectId, userId, teamId);

      if (this.socketService) {
        const workshopId = (project as any).workshop?._id || project.workshop;
        this.socketService.emitToWorkshop(workshopId.toString(), 'workshop:project:team:assigned', project);
      }

      res.json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  };

  removeTeam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId, teamId } = req.params;
      const userId = req.user!.id;
      const project = await this.projectService.removeTeamFromProject(projectId, userId, teamId);

      if (this.socketService) {
        const workshopId = (project as any).workshop?._id || project.workshop;
        this.socketService.emitToWorkshop(workshopId.toString(), 'workshop:project:team:removed', project);
      }

      res.json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  };

  assignIndividual = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId } = req.params;
      const { userId: targetUserId } = req.body;
      const userId = req.user!.id;

      if (!targetUserId) throw new Error('Target User ID is required');

      const project = await this.projectService.assignIndividualToProject(projectId, userId, targetUserId);

      if (this.socketService) {
        const workshopId = (project as any).workshop?._id || project.workshop;
        this.socketService.emitToWorkshop(workshopId.toString(), 'workshop:project:individual:assigned', project);
      }

      res.json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  };

  removeIndividual = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId, individualId } = req.params;
      const userId = req.user!.id;
      const project = await this.projectService.removeIndividualFromProject(projectId, userId, individualId);

      if (this.socketService) {
        const workshopId = (project as any).workshop?._id || project.workshop;
        this.socketService.emitToWorkshop(workshopId.toString(), 'workshop:project:individual:removed', project);
      }

      res.json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  };

  assignProjectManager = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId } = req.params;
      const { userId: targetUserId } = req.body;
      const userId = req.user!.id;

      if (!targetUserId) throw new Error('Target Manager User ID is required');

      const project = await this.projectService.assignProjectManager(projectId, userId, targetUserId);

      if (this.socketService) {
        const workshopId = (project as any).workshop?._id || project.workshop;
        this.socketService.emitToWorkshop(workshopId.toString(), 'workshop:project:manager:assigned', project);
        this.socketService.emitToWorkshop(workshopId.toString(), 'workshop:project:updated', project);
      }

      res.json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  };

  addMaintainer = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId } = req.params;
      const { userId: maintainerId } = req.body;
      const userId = req.user!.id;

      if (!maintainerId) throw new Error('Maintainer User ID is required');

      const project = await this.projectService.addMaintainer(projectId, userId, maintainerId);

      if (this.socketService) {
        const workshopId = (project as any).workshop?._id || project.workshop;
        this.socketService.emitToWorkshop(workshopId.toString(), 'workshop:project:maintainer:assigned', project);
        this.socketService.emitToWorkshop(workshopId.toString(), 'workshop:project:updated', project);
      }

      res.json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  };

  removeMaintainer = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId, maintainerId } = req.params;
      const userId = req.user!.id;

      const project = await this.projectService.removeMaintainer(projectId, userId, maintainerId);

      if (this.socketService) {
        const workshopId = (project as any).workshop?._id || project.workshop;
        this.socketService.emitToWorkshop(workshopId.toString(), 'workshop:project:maintainer:removed', project);
        this.socketService.emitToWorkshop(workshopId.toString(), 'workshop:project:updated', project);
      }

      res.json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  };
}