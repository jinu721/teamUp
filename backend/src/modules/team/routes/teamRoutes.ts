import { Router } from 'express';
import { authenticate } from '../../../shared/middlewares/auth';
import { requireWorkshopMembership, requireWorkshopManager } from '../../../shared/middlewares/permission';
import { Container } from '../../../di/types';

export const createTeamRoutes = (container: Container) => {
    const router = Router({ mergeParams: true });
    const teamController = container.teamCtrl;

    router.use(authenticate);

    router.post('/', requireWorkshopManager, teamController.createTeam);
    router.get('/:id', requireWorkshopMembership, teamController.getTeam);
    router.put('/:id', requireWorkshopManager, teamController.updateTeam);
    router.delete('/:id', requireWorkshopManager, teamController.deleteTeam);
    router.post('/:id/members', requireWorkshopManager, teamController.addMember);
    router.delete('/:id/members/:userId', requireWorkshopManager, teamController.removeMember);
    router.get('/user/:userId', requireWorkshopMembership, teamController.getUserTeams);

    return router;
};

export default createTeamRoutes;