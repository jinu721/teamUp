import { Router } from 'express';
import passport from 'passport';
import { AuthController } from '../controllers/AuthController';
import { authenticate } from '../middlewares/auth';
import { configurePassport } from '../config/passport';
import { generateToken, generateRefreshToken } from '../config/jwt';

const router = Router();
const authController = new AuthController();

// Initialize Passport Strategies
configurePassport();

router.post('/register', authController.register as any);
router.get('/verify-email/:token', authController.verifyEmail as any);
router.post('/login', authController.login as any);
router.post('/refresh-token', authController.refreshToken as any);
router.get('/me', authenticate as any, authController.getProfile as any);

// Google Auth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    (req, res) => {
        const user = req.user as any;
        const token = generateToken({ id: user._id.toString(), email: user.email });
        const refreshToken = generateRefreshToken({ id: user._id.toString(), email: user.email });
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/social-callback?token=${token}&refreshToken=${refreshToken}`);
    }
);

// GitHub Auth
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback',
    passport.authenticate('github', { session: false, failureRedirect: '/login' }),
    (req, res) => {
        const user = req.user as any;
        const token = generateToken({ id: user._id.toString(), email: user.email });
        const refreshToken = generateRefreshToken({ id: user._id.toString(), email: user.email });
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/social-callback?token=${token}&refreshToken=${refreshToken}`);
    }
);

export default router;
