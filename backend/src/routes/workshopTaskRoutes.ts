import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { Container } from '../di/types';

export const createWorkshopTaskRoutes = (container: Container) => {
    const router = Router({ mergeParams: true });
    const taskController = container.workshopTaskCtrl;

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

    return router;
};

export const createTaskRouter = (_container: Container) => {
    const router = Router({ mergeParams: true });
    router.use(authenticate);
    return router;
};

export const createUserTaskRouter = (container: Container) => {
    const router = Router();
    const taskController = container.workshopTaskCtrl;
    router.use(authenticate);
    router.get('/my-tasks', taskController.getMyTasks);
    return router;
};

export const createTeamTaskRouter = (container: Container) => {
    const router = Router();
    const taskController = container.workshopTaskCtrl;
    router.use(authenticate);
    router.get('/:teamId/tasks', taskController.getTeamTasks);
    return router;
};

export default createWorkshopTaskRoutes;