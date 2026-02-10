export interface IAuthService {
    generateTokens(user: any): { token: string; refreshToken: string };
    register(name: string, email: string, password: string): Promise<{ message: string }>;
    verifyOTP(email: string, otp: string): Promise<{ user: any; token: string; refreshToken: string }>;
    resendOTP(email: string): Promise<{ message: string }>;
    login(email: string, password: string): Promise<{ user: any; token: string; refreshToken: string }>;
    refreshToken(token: string): Promise<{ token: string }>;
    getProfile(userId: string): Promise<any>;
    socialLogin(profile: any, type: 'google' | 'github'): Promise<any>;
    updateProfile(userId: string, data: any): Promise<any>;
    forgotPassword(email: string): Promise<{ message: string }>;
    resetPassword(token: string, newPassword: string): Promise<{ message: string }>;
}
