import { Router } from 'express';
import { authMiddleware } from '@middlewares';
import { PROJECT_ROUTES } from '@constants';
import { Container } from '@di/types';

export const createWorkshopProjectRoutes = (container: Container) => {
    const router = Router({ mergeParams: true });
    const projectController = container.workshopProjectCtrl;

    router.use(authMiddleware);

    router.post(PROJECT_ROUTES.BASE, projectController.createProject);
    router.get(PROJECT_ROUTES.BASE, projectController.getProjects);
    router.get(PROJECT_ROUTES.ACCESSIBLE, projectController.getAccessibleProjects);
    router.get(PROJECT_ROUTES.BY_ID, projectController.getProject);
    router.put(PROJECT_ROUTES.BY_ID, projectController.updateProject);
    router.delete(PROJECT_ROUTES.BY_ID, projectController.deleteProject);
    router.post(PROJECT_ROUTES.TEAMS, projectController.assignTeam);
    router.delete(PROJECT_ROUTES.TEAM_BY_ID, projectController.removeTeam);
    router.post(PROJECT_ROUTES.INDIVIDUALS, projectController.assignIndividual);
    router.delete(PROJECT_ROUTES.INDIVIDUAL_BY_ID, projectController.removeIndividual);
    router.post(PROJECT_ROUTES.MANAGER, projectController.assignProjectManager);
    router.post(PROJECT_ROUTES.MAINTAINERS, projectController.addMaintainer);
    router.delete(PROJECT_ROUTES.MAINTAINER_BY_ID, projectController.removeMaintainer);

    return router;
};

export default createWorkshopProjectRoutes;