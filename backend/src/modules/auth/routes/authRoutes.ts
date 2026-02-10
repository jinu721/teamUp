import { Router } from 'express';
import passport from 'passport';
import { authenticate } from '../../../shared/middlewares/auth';
import { isStrategyEnabled } from '../../../config/passport';
import { Container } from '../../../di/types';

export const createAuthRoutes = (container: Container) => {
    const router = Router();
    const authController = container.authCtrl;


    router.post('/register', authController.register as any);
    router.post('/verify-otp', authController.verifyOTP as any);
    router.post('/resend-otp', authController.resendOTP as any);
    router.post('/login', authController.login as any);
    router.post('/refresh-token', authController.refreshToken as any);
    router.post('/forgot-password', authController.forgotPassword as any);
    router.post('/reset-password', authController.resetPassword as any);
    router.get('/me', authenticate as any, authController.getProfile as any);
    router.put('/profile', authenticate as any, authController.updateProfile as any);

    router.get('/google', (req, res, next) => {
        if (!isStrategyEnabled('google')) {
            return res.status(400).json({
                success: false,
                message: 'Google authentication is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the backend .env file.'
            });
        }
        return passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
    });

    router.get('/google/callback', (req, res, next) => {
        if (!isStrategyEnabled('google')) {
            return res.redirect((process.env.FRONTEND_URL || 'http://localhost:3000') + '/login?error=google_not_configured');
        }
        return passport.authenticate('google', { session: false, failureRedirect: '/login' })(req, res, next);
    }, (req, res) => {
        const user = req.user as any;
        const token = container.tokenProv.generateToken({ id: user._id.toString(), email: user.email });
        const refreshToken = container.tokenProv.generateRefreshToken({ id: user._id.toString(), email: user.email });
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/social-callback?token=${token}&refreshToken=${refreshToken}`);
    });

    router.get('/github', (req, res, next) => {
        if (!isStrategyEnabled('github')) {
            return res.status(400).json({
                success: false,
                message: 'GitHub authentication is not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in the backend .env file.'
            });
        }
        return passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
    });

    router.get('/github/callback', (req, res, next) => {
        if (!isStrategyEnabled('github')) {
            return res.redirect((process.env.FRONTEND_URL || 'http://localhost:3000') + '/login?error=github_not_configured');
        }
        return passport.authenticate('github', { session: false, failureRedirect: '/login' })(req, res, next);
    }, (req, res) => {
        const user = req.user as any;
        const token = container.tokenProv.generateToken({ id: user._id.toString(), email: user.email });
        const refreshToken = container.tokenProv.generateRefreshToken({ id: user._id.toString(), email: user.email });
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/social-callback?token=${token}&refreshToken=${refreshToken}`);
    });

    return router;
};

export default createAuthRoutes;