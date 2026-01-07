import { Router } from 'express';
import { TeamController } from '../controllers/TeamController';
import { authenticate } from '../middlewares/auth';
import { requireWorkshopMembership, requireWorkshopManager } from '../middlewares/permission';
import { TeamService } from '../services/TeamService';

const router = Router({ mergeParams: true }); // Enable access to parent route params
const teamService = new TeamService();
const teamController = new TeamController();

// All routes require authentication
router.use(authenticate);

// Team CRUD
router.post('/', requireWorkshopManager, teamController.createTeam);
// router.get('/', requireWorkshopMembership, teamController.getTeams); // TODO: Implement getTeams
router.get('/:id', requireWorkshopMembership, teamController.getTeam);
router.put('/:id', requireWorkshopManager, teamController.updateTeam);
router.delete('/:id', requireWorkshopManager, teamController.deleteTeam);

// Member management
router.post('/:id/members', requireWorkshopManager, teamController.addMember);
router.delete('/:id/members/:userId', requireWorkshopManager, teamController.removeMember);

// Internal role management
// router.post('/:id/roles', requireWorkshopManager, teamController.assignRole); // TODO: Implement assignRole
// router.delete('/:id/roles/:userId/:roleName', requireWorkshopManager, teamController.removeRole); // TODO: Implement removeRole

// User teams query
router.get('/user/:userId', requireWorkshopMembership, teamController.getUserTeams);

export default router;
export { teamService, teamController };
