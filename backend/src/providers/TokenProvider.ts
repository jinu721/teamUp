import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
    id: string;
    email: string;
}

export class TokenProvider {
    private readonly secret = env.JWT_SECRET;
    private readonly refreshSecret = process.env.REFRESH_TOKEN_SECRET || 'refresh_secret';

    generateToken(payload: JwtPayload): string {
        return jwt.sign(payload, this.secret, { expiresIn: '15m' });
    }

    generateRefreshToken(payload: JwtPayload): string {
        return jwt.sign(payload, this.refreshSecret, { expiresIn: '7d' });
    }

    verifyToken(token: string): JwtPayload {
        return jwt.verify(token, this.secret) as JwtPayload;
    }

    verifyRefreshToken(token: string): JwtPayload {
        return jwt.verify(token, this.refreshSecret) as JwtPayload;
    }
}
