import { Router } from 'express';
import { WorkshopProjectController } from '../controllers/WorkshopProjectController';
import { authenticate } from '../middlewares/auth';
import { WorkshopProjectService } from '../services/WorkshopProjectService';

const router = Router({ mergeParams: true });
const projectService = new WorkshopProjectService();
const projectController = new WorkshopProjectController(projectService);

router.use(authenticate);

router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/accessible', projectController.getAccessibleProjects);
router.get('/:projectId', projectController.getProject);
router.put('/:projectId', projectController.updateProject);
router.delete('/:projectId', projectController.deleteProject);

router.post('/:projectId/teams', projectController.assignTeam);
router.delete('/:projectId/teams/:teamId', projectController.removeTeam);

router.post('/:projectId/individuals', projectController.assignIndividual);
router.delete('/:projectId/individuals/:userId', projectController.removeIndividual);

router.post('/:projectId/manager', projectController.assignProjectManager);

router.post('/:projectId/maintainers', projectController.addMaintainer);
router.delete('/:projectId/maintainers/:maintainerId', projectController.removeMaintainer);

export default router;
export { projectService, projectController };