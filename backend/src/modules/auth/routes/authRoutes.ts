import { Router } from 'express';
import { authMiddleware } from '@middlewares';
import { AUTH_ROUTES } from '@constants';
import { Container } from '@di/types';

export const createAuthRoutes = (container: Container) => {
    const router = Router();
    const authController = container.authCtrl;

    router.post(AUTH_ROUTES.REGISTER, authController.register as any);
    router.post(AUTH_ROUTES.VERIFY_OTP, authController.verifyOTP as any);
    router.post(AUTH_ROUTES.RESEND_OTP, authController.resendOTP as any);
    router.post(AUTH_ROUTES.LOGIN, authController.login as any);
    router.post(AUTH_ROUTES.REFRESH_TOKEN, authController.refreshToken as any);
    router.post(AUTH_ROUTES.FORGOT_PASSWORD, authController.forgotPassword as any);
    router.post(AUTH_ROUTES.RESET_PASSWORD, authController.resetPassword as any);
    router.get(AUTH_ROUTES.ME, authMiddleware as any, authController.getProfile as any);
    router.put(AUTH_ROUTES.PROFILE, authMiddleware as any, authController.updateProfile as any);

    router.get(AUTH_ROUTES.GOOGLE, authController.initiateGoogleAuth);
    router.get(AUTH_ROUTES.GOOGLE_CALLBACK, authController.handleGoogleCallback, authController.completeSocialLogin);

    router.get(AUTH_ROUTES.GITHUB, authController.initiateGithubAuth);
    router.get(AUTH_ROUTES.GITHUB_CALLBACK, authController.handleGithubCallback, authController.completeSocialLogin);

    return router;
};

export default createAuthRoutes;