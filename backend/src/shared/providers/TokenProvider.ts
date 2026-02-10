import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { ITokenProvider, JwtPayload } from '../interfaces/ITokenProvider';

export class TokenProvider implements ITokenProvider {
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
