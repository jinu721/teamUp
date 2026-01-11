import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { User } from '../models/User';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

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
                        // Check if user exists by Google ID
                        let user = await User.findOne({ googleId: profile.id });

                        if (user) {
                            return done(null, user as any);
                        }

                        // Check if user exists by email
                        const email = profile.emails?.[0]?.value;
                        if (email) {
                            user = await User.findOne({ email });
                            if (user) {
                                // Link account
                                user.googleId = profile.id;
                                // If they weren't verified (maybe registered but didn't click link), 
                                // trust Google and verify them? Yes, usually safe.
                                if (!user.isVerified) user.isVerified = true;
                                await user.save();
                                return done(null, user as any);
                            }
                        }

                        // Create new user
                        const dummyPassword = crypto.randomBytes(32).toString('hex');
                        const hashedPassword = await bcrypt.hash(dummyPassword, 10);

                        user = await User.create({
                            name: profile.displayName || 'User',
                            email: email || `${profile.id}@google.com`, // Fallback
                            password: hashedPassword,
                            googleId: profile.id,
                            isVerified: true,
                            profilePhoto: profile.photos?.[0]?.value || '',
                        });

                        return done(null, user as any);
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
                        let user = await User.findOne({ githubId: profile.id });

                        if (user) {
                            return done(null, user as any);
                        }

                        const email = profile.emails?.[0]?.value;
                        // GitHub might verify email differently, but logic similar
                        if (email) {
                            user = await User.findOne({ email });
                            if (user) {
                                user.githubId = profile.id;
                                if (!user.isVerified) user.isVerified = true;
                                await user.save();
                                return done(null, user as any);
                            }
                        }

                        const dummyPassword = crypto.randomBytes(32).toString('hex');
                        const hashedPassword = await bcrypt.hash(dummyPassword, 10);

                        user = await User.create({
                            name: profile.displayName || profile.username || 'User',
                            email: email || `${profile.id}@github.com`,
                            password: hashedPassword,
                            githubId: profile.id,
                            isVerified: true,
                            profilePhoto: profile.photos?.[0]?.value || '',
                        });

                        return done(null, user as any);
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
