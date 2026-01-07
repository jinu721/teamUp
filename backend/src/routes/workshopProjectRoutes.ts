import { Router } from 'express';
import { WorkshopProjectController } from '../controllers/WorkshopProjectController';
import { authenticate } from '../middlewares/auth';
import { WorkshopProjectService } from '../services/WorkshopProjectService';

const router = Router({ mergeParams: true }); // Enable access to parent route params
const projectService = new WorkshopProjectService();
const projectController = new WorkshopProjectController(projectService);

// All routes require authentication
router.use(authenticate);

// Project CRUD
router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/accessible', projectController.getAccessibleProjects);
router.get('/:id', projectController.getProject);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

// Team assignment
router.post('/:id/teams', projectController.assignTeam);
router.delete('/:id/teams/:teamId', projectController.removeTeam);

// Individual assignment
router.post('/:id/individuals', projectController.assignIndividual);
router.delete('/:id/individuals/:userId', projectController.removeIndividual);

export default router;
export { projectService, projectController };
