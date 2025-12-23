import { Router } from 'express';
import { CommunityController } from '../controllers/CommunityController';
import { authenticate } from '../middlewares/auth';
import { CommunityService } from '../services/CommunityService';

const router = Router();
const communityService = new CommunityService();
const communityController = new CommunityController(communityService);

router.use(authenticate);

router.post('/projects', communityController.createCommunityProject);
router.get('/projects', communityController.getCommunityProjects);
router.get('/projects/:id', communityController.getCommunityProjectById);
router.post('/projects/:id/like', communityController.likeProject);
router.post('/projects/:id/comment', communityController.commentOnProject);
router.post('/projects/:id/join', communityController.requestToJoin);

export default router;
export { communityService };
