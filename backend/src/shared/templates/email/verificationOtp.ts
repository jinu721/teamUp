export const verificationOtpTemplate = (otp: string): string => `
  <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
    <h1 style="color: #333; text-align: center;">Welcome to Team Up!</h1>
    <p>Your verification code is:</p>
    <div style="text-align: center; margin: 30px 0;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #007bff; background: #f0f7ff; padding: 10px 20px; border-radius: 5px; border: 1px dashed #007bff;">${otp}</span>
    </div>
    <p style="text-align: center; color: #666;">This code will expire in 10 minutes.</p>
    <p style="color: #777; font-size: 12px; margin-top: 30px; text-align: center;">If you didn't request this, please ignore this email.</p>
  </div>
`;
