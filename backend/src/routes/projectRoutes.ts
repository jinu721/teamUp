import { Router } from 'express';
import { ProjectController } from '../controllers/ProjectController';
import { authenticate } from '../middlewares/auth';
import { ProjectService } from '../services/ProjectService';

const router = Router();
const projectService = new ProjectService();
const projectController = new ProjectController(projectService);

router.use(authenticate);

router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProjectById);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);
router.post('/:id/invite', projectController.inviteTeamMember);

export default router;
export { projectService };
