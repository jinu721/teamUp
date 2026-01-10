import { Router } from 'express';
import passport from 'passport';
import { AuthController } from '../controllers/AuthController';
import { authenticate } from '../middlewares/auth';
import { configurePassport } from '../config/passport';
import { generateToken } from '../config/jwt';

const router = Router();
const authController = new AuthController();

// Initialize Passport Strategies
configurePassport();

router.post('/register', authController.register);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/login', authController.login);
router.get('/me', authenticate, authController.getProfile);

// Google Auth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    (req, res) => {
        const user = req.user as any;
        const token = generateToken({ id: user._id.toString(), email: user.email });
        // Redirect to frontend
        res.redirect(`http://localhost:3000/social-callback?token=${token}`);
    }
);

// GitHub Auth
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback',
    passport.authenticate('github', { session: false, failureRedirect: '/login' }),
    (req, res) => {
        const user = req.user as any;
        const token = generateToken({ id: user._id.toString(), email: user.email });
        res.redirect(`http://localhost:3000/social-callback?token=${token}`);
    }
);

export default router;
