import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { AuthService } from '../services/AuthService';

const authService = new AuthService();

// Serialize/Deserialize not strictly needed for JWT-only sessionless, 
// but Passport often requires it if using session. We are using session: false in routes.

export const configurePassport = () => {
    // GOOGLE STRATEGY
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        console.log('Initializing Google Strategy...');
        passport.use(
            new GoogleStrategy(
                {
                    clientID: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
        console.warn('Google Client ID/Secret missing. Google Auth disabled.');
    }

    // GITHUB STRATEGY
    if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
        console.log('Initializing GitHub Strategy...');
        passport.use(
            new GitHubStrategy(
                {
                    clientID: process.env.GITHUB_CLIENT_ID,
                    clientSecret: process.env.GITHUB_CLIENT_SECRET,
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
        console.warn('GitHub Client ID/Secret missing. GitHub Auth disabled.');
    }
};
