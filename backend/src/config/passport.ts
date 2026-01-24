import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { AuthService } from '../services/AuthService';

const authService = new AuthService();

export const isStrategyEnabled = (strategy: string): boolean => {
    switch (strategy) {
        case 'google':
            return !!(
                process.env.GOOGLE_CLIENT_ID &&
                process.env.GOOGLE_CLIENT_SECRET
            );
        case 'github':
            return !!(
                process.env.GITHUB_CLIENT_ID &&
                process.env.GITHUB_CLIENT_SECRET
            );
        default:
            return false;
    }
};

export const configurePassport = () => {

    if (isStrategyEnabled('google')) {
        console.log('Initializing Google Strategy...');
        passport.use(
            new GoogleStrategy(
                {
                    clientID: process.env.GOOGLE_CLIENT_ID!,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
                    callbackURL: `${process.env.APP_URL}/api/auth/google/callback`,
                },
                async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
                    try {
                        const user = await authService.socialLogin(profile, 'google');
                        return done(null, user);
                    } catch (error) {
                        return done(error as Error, undefined);
                    }
                }
            )
        );
    } else {
        console.warn('Google Auth disabled');
    }

    if (isStrategyEnabled('github')) {
        console.log('Initializing GitHub Strategy...');
        passport.use(
            new GitHubStrategy(
                {
                    clientID: process.env.GITHUB_CLIENT_ID!,
                    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
                    callbackURL: `${process.env.APP_URL}/api/auth/github/callback`,
                    scope: ['user:email'],
                },
                async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
                    try {
                        const user = await authService.socialLogin(profile, 'github');
                        return done(null, user);
                    } catch (error) {
                        return done(error as Error, undefined);
                    }
                }
            )
        );
    } else {
        console.warn('GitHub Auth disabled');
    }
};
