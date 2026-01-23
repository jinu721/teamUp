import { Router } from 'express';
import { TeamController } from '../controllers/TeamController';
import { authenticate } from '../middlewares/auth';
import { requireWorkshopMembership, requireWorkshopManager } from '../middlewares/permission';
import { TeamService } from '../services/TeamService';

const router = Router({ mergeParams: true });
const teamService = new TeamService();
const teamController = new TeamController();

router.use(authenticate);

router.post('/', requireWorkshopManager, teamController.createTeam);

router.get('/:id', requireWorkshopMembership, teamController.getTeam);
router.put('/:id', requireWorkshopManager, teamController.updateTeam);
router.delete('/:id', requireWorkshopManager, teamController.deleteTeam);

router.post('/:id/members', requireWorkshopManager, teamController.addMember);
router.delete('/:id/members/:userId', requireWorkshopManager, teamController.removeMember);

router.get('/user/:userId', requireWorkshopMembership, teamController.getUserTeams);

export default router;
export { teamService, teamController };