export const passwordResetTemplate = (userName: string, resetUrl: string): string => `
  <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
    <h1 style="color: #333; text-align: center;">Reset Your Password</h1>
    <p>Hi ${userName},</p>
    <p>You requested to reset your password for your Team Up account. Click the button below to reset it:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
    </div>
    <p style="color: #666;">This link will expire in 1 hour for security reasons.</p>
    <p style="color: #666;">If you didn't request this password reset, please ignore this email.</p>
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
    <p style="color: #777; font-size: 12px; text-align: center;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${resetUrl}" style="color: #007bff;">${resetUrl}</a>
    </p>
  </div>
`;
