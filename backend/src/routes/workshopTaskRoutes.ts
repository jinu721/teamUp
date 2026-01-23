import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { taskController } from './workshopRoutes';
const router = Router({ mergeParams: true });

router.use(authenticate);

router.post('/', taskController.createTask);
router.get('/', taskController.getProjectTasks);
router.get('/board', taskController.getProjectTaskBoard);

router.get('/:taskId', taskController.getTask);
router.put('/:taskId', taskController.updateTask);
router.delete('/:taskId', taskController.deleteTask);

router.put('/:taskId/status', taskController.updateTaskStatus);

router.post('/:taskId/comments', taskController.addComment);

router.post('/:taskId/attachments', taskController.addAttachment);

router.post('/:taskId/teams', taskController.assignTeam);

router.post('/:taskId/individuals', taskController.assignIndividual);

router.get('/:taskId/activity', taskController.getTaskActivities);

export const userTaskRouter = Router();
userTaskRouter.use(authenticate);
userTaskRouter.get('/my-tasks', taskController.getMyTasks);

export const teamTaskRouter = Router();
teamTaskRouter.use(authenticate);
teamTaskRouter.get('/:teamId/tasks', taskController.getTeamTasks);

export default router;
export { router as taskRouter };