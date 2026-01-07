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
// Project CRUD
router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/accessible', projectController.getAccessibleProjects);
router.get('/:projectId', projectController.getProject);
router.put('/:projectId', projectController.updateProject);
router.delete('/:projectId', projectController.deleteProject);

// Team assignment
router.post('/:projectId/teams', projectController.assignTeam);
router.delete('/:projectId/teams/:teamId', projectController.removeTeam);

// Individual assignment
router.post('/:projectId/individuals', projectController.assignIndividual);
router.delete('/:projectId/individuals/:userId', projectController.removeIndividual);

// Manager assignment
router.post('/:projectId/manager', projectController.assignProjectManager);

// Maintainer assignment
router.post('/:projectId/maintainers', projectController.addMaintainer);
router.delete('/:projectId/maintainers/:maintainerId', projectController.removeMaintainer);

export default router;
export { projectService, projectController };
