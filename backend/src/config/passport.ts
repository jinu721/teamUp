import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { AuthService } from '../services/AuthService';

const authService = new AuthService();

export const isStrategyEnabled = (strategy: string): boolean => {
    switch (strategy) {
        case 'google':
            return !!(process.env.GOOGLE_CLIENT_ID &&
                process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id' &&
                process.env.GOOGLE_CLIENT_SECRET &&
                process.env.GOOGLE_CLIENT_SECRET !== 'your_google_client_secret');
        case 'github':
            return !!(process.env.GITHUB_CLIENT_ID &&
                process.env.GITHUB_CLIENT_ID !== 'your_github_client_id' &&
                process.env.GITHUB_CLIENT_SECRET &&
                process.env.GITHUB_CLIENT_SECRET !== 'your_github_client_secret');
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
                    callbackURL: '/api/auth/google/callback',
                },
                async (_accessToken, _refreshToken, profile, done) => {
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
        console.warn('Google Auth disabled: Client ID or Secret missing or using placeholders.');
    }

    if (isStrategyEnabled('github')) {
        console.log('Initializing GitHub Strategy...');
        passport.use(
            new GitHubStrategy(
                {
                    clientID: process.env.GITHUB_CLIENT_ID!,
                    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
                    callbackURL: '/api/auth/github/callback',
                    scope: ['user:email'],
                },
                async (_accessToken: string, _refreshToken: string, profile: any, done: Function) => {
                    try {
                        const user = await authService.socialLogin(profile, 'github');
                        return done(null, user);
                    } catch (error) {
                        return done(error, undefined);
                    }
                }
            )
        );
    } else {
        console.warn('GitHub Auth disabled: Client ID or Secret missing or using placeholders.');
    }
};