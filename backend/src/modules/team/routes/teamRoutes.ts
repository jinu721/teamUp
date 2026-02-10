import { Router } from 'express';
import { authMiddleware, requireWorkshopMembership, requireWorkshopManager } from '@middlewares';
import { TEAM_ROUTES } from '@constants';
import { Container } from '@di/types';

export const createTeamRoutes = (container: Container) => {
    const router = Router({ mergeParams: true });
    const teamController = container.teamCtrl;

    router.use(authMiddleware);

    router.post(TEAM_ROUTES.BASE, requireWorkshopManager, teamController.createTeam);
    router.get(TEAM_ROUTES.BY_ID, requireWorkshopMembership, teamController.getTeam);
    router.put(TEAM_ROUTES.BY_ID, requireWorkshopManager, teamController.updateTeam);
    router.delete(TEAM_ROUTES.BY_ID, requireWorkshopManager, teamController.deleteTeam);
    router.post(TEAM_ROUTES.MEMBERS, requireWorkshopManager, teamController.addMember);
    router.delete(TEAM_ROUTES.MEMBER_BY_ID, requireWorkshopManager, teamController.removeMember);
    router.get(TEAM_ROUTES.USER_TEAMS, requireWorkshopMembership, teamController.getUserTeams);

    return router;
};

export default createTeamRoutes;