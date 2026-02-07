import { Router } from 'express';
import { InviteController } from '../controllers/InviteController';
import { authenticate } from '../middlewares/auth';

const router = Router();
const inviteController = new InviteController();

router.get('/:token', inviteController.getInviteDetails as any);
router.post('/:token/accept', authenticate as any, inviteController.acceptInvite as any);

export default router;
