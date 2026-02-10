import { Router } from 'express';
import { authMiddleware } from '@middlewares';
import { TASK_ROUTES } from '@constants';
import { Container } from '@di/types';

export const createWorkshopTaskRoutes = (container: Container) => {
    const router = Router({ mergeParams: true });
    const taskController = container.workshopTaskCtrl;

    router.use(authMiddleware);

    router.post(TASK_ROUTES.BASE, taskController.createTask);
    router.get(TASK_ROUTES.BASE, taskController.getProjectTasks);
    router.get(TASK_ROUTES.BOARD, taskController.getProjectTaskBoard);
    router.get(TASK_ROUTES.BY_ID, taskController.getTask);
    router.put(TASK_ROUTES.BY_ID, taskController.updateTask);
    router.delete(TASK_ROUTES.BY_ID, taskController.deleteTask);
    router.put(TASK_ROUTES.STATUS, taskController.updateTaskStatus);
    router.post(TASK_ROUTES.COMMENTS, taskController.addComment);
    router.post(TASK_ROUTES.ATTACHMENTS, taskController.addAttachment);
    router.post(TASK_ROUTES.TEAMS, taskController.assignTeam);
    router.post(TASK_ROUTES.INDIVIDUALS, taskController.assignIndividual);
    router.get(TASK_ROUTES.ACTIVITY, taskController.getTaskActivities);

    return router;
};

export const createTaskRouter = (_container: Container) => {
    const router = Router({ mergeParams: true });
    router.use(authMiddleware);
    return router;
};

export const createUserTaskRouter = (container: Container) => {
    const router = Router();
    const taskController = container.workshopTaskCtrl;
    router.use(authMiddleware);
    router.get(TASK_ROUTES.MY_TASKS, taskController.getMyTasks);
    return router;
};

export const createTeamTaskRouter = (container: Container) => {
    const router = Router();
    const taskController = container.workshopTaskCtrl;
    router.use(authMiddleware);
    router.get(TASK_ROUTES.TEAM_TASKS, taskController.getTeamTasks);
    return router;
};

export default createWorkshopTaskRoutes;