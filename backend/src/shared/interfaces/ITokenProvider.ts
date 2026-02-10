export interface JwtPayload {
    id: string;
    email: string;
}

export interface ITokenProvider {
    generateToken(payload: JwtPayload): string;
    generateRefreshToken(payload: JwtPayload): string;
    verifyToken(token: string): JwtPayload;
    verifyRefreshToken(token: string): JwtPayload;
}
