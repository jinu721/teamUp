import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { taskController } from './workshopRoutes';
const router = Router({ mergeParams: true });

// Use the controller's socket service if available
// This is usually handled in the main server setup

// All routes require authentication
router.use(authenticate);

// -----------------------------------------
// Project-Scoped Task Routes
// -----------------------------------------
// URL: /workshops/:workshopId/projects/:projectId/tasks

router.post('/', taskController.createTask);
router.get('/', taskController.getProjectTasks);
router.get('/board', taskController.getProjectTaskBoard);

// -----------------------------------------
// Task Operation Routes (scoped by taskId)
// -----------------------------------------
// URL: /workshops/:workshopId/projects/:projectId/tasks/:taskId

router.get('/:taskId', taskController.getTask);
router.put('/:taskId', taskController.updateTask);
router.delete('/:taskId', taskController.deleteTask);

// Status update
router.put('/:taskId/status', taskController.updateTaskStatus);

// Comments
router.post('/:taskId/comments', taskController.addComment);

// Attachments
router.post('/:taskId/attachments', taskController.addAttachment);

// Team assignment
router.post('/:taskId/teams', taskController.assignTeam);

// Individual assignment
router.post('/:taskId/individuals', taskController.assignIndividual);

// Task Activity
router.get('/:taskId/activity', taskController.getTaskActivities);



// -----------------------------------------
// Standalone Task Routes (User/Team Context)
// -----------------------------------------

export const userTaskRouter = Router();
userTaskRouter.use(authenticate);
userTaskRouter.get('/my-tasks', taskController.getMyTasks);

export const teamTaskRouter = Router();
teamTaskRouter.use(authenticate);
teamTaskRouter.get('/:teamId/tasks', taskController.getTeamTasks);

export default router;
export { router as taskRouter };
