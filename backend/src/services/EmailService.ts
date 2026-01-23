import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private fromEmail: string;
  private appUrl: string;
  private emailEnabled: boolean;

  constructor() {
    const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
    const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

    this.fromEmail = process.env.EMAIL_FROM || emailUser || 'noreply@teamup.com';
    this.appUrl = process.env.APP_URL || 'http://localhost:5173';
    const hasCredentials = !!(emailUser && emailPass);
    this.emailEnabled = hasCredentials;

    if (hasCredentials) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass
        }
      });
      console.log('📧 Email service initialized with Gmail:', emailUser);
    } else {
      console.log('📧 Email service running in console-only mode (no credentials found)');
    }
  }

  async sendProjectInvitation(
    toEmail: string,
    inviterName: string,
    projectTitle: string,
    _projectId: string,
    inviteToken: string
  ): Promise<boolean> {
    const inviteLink = `${this.appUrl}/invite/${inviteToken}`;

    console.log('\n========================================');
    console.log('📧 PROJECT INVITATION');
    console.log('========================================');
    console.log(`To: ${toEmail}`);
    console.log(`From: ${inviterName}`);
    console.log(`Project: ${projectTitle}`);
    console.log(`\n🔗 INVITE LINK: ${inviteLink}`);
    console.log('========================================\n');

    if (!this.emailEnabled || !this.transporter) {
      console.log('(Email not sent - SMTP not configured. Share the link above manually)');
      return true;
    }

    const mailOptions = {
      from: `"TeamUp" <${this.fromEmail}>`,
      to: toEmail,
      subject: `You've been invited to join "${projectTitle}" on TeamUp`,
      html: this.getInvitationEmailHtml(inviterName, projectTitle, inviteLink),
      text: `You've been invited to join "${projectTitle}" on TeamUp!\n\n${inviterName} has invited you to collaborate on their project.\n\nClick here to accept: ${inviteLink}\n\nThis invitation will expire in 7 days.`
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      console.log('📋 Share this link manually:', inviteLink);
      return true;
    }
  }

  async sendJoinRequestNotification(
    toEmail: string,
    requesterName: string,
    postTitle: string,
    postId: string
  ): Promise<boolean> {
    const viewLink = `${this.appUrl}/community?post=${postId}`;

    console.log('\n========================================');
    console.log('📧 JOIN REQUEST NOTIFICATION');
    console.log('========================================');
    console.log(`To: ${toEmail}`);
    console.log(`Requester: ${requesterName}`);
    console.log(`Post: ${postTitle}`);
    console.log(`\n🔗 VIEW LINK: ${viewLink}`);
    console.log('========================================\n');

    if (!this.emailEnabled || !this.transporter) {
      return true;
    }

    const mailOptions = {
      from: `"TeamUp" <${this.fromEmail}>`,
      to: toEmail,
      subject: `New join request for "${postTitle}"`,
      html: this.getJoinRequestEmailHtml(requesterName, postTitle, viewLink),
      text: `${requesterName} wants to join your project "${postTitle}". View the request: ${viewLink}`
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return true;
    }
  }

  async sendJoinRequestResponse(
    toEmail: string,
    postTitle: string,
    status: 'approved' | 'rejected',
    projectId?: string
  ): Promise<boolean> {
    const isApproved = status === 'approved';
    const projectLink = projectId ? `${this.appUrl}/projects/${projectId}` : '';

    console.log('\n========================================');
    console.log(`📧 JOIN REQUEST ${isApproved ? 'APPROVED' : 'REJECTED'}`);
    console.log('========================================');
    console.log(`To: ${toEmail}`);
    console.log(`Post: ${postTitle}`);
    console.log(`Status: ${status}`);
    if (projectLink) console.log(`\n🔗 PROJECT LINK: ${projectLink}`);
    console.log('========================================\n');

    if (!this.emailEnabled || !this.transporter) {
      return true;
    }

    const mailOptions = {
      from: `"TeamUp" <${this.fromEmail}>`,
      to: toEmail,
      subject: isApproved
        ? `🎉 Your request to join "${postTitle}" was approved!`
        : `Update on your request to join "${postTitle}"`,
      html: this.getJoinResponseEmailHtml(postTitle, isApproved, projectLink),
      text: isApproved
        ? `Your request to join "${postTitle}" was approved! ${projectLink ? `Go to project: ${projectLink}` : ''}`
        : `Your request to join "${postTitle}" was not approved at this time.`
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return true;
    }
  }

  async sendWorkshopInvitation(
    toEmail: string,
    inviterName: string,
    workshopName: string,
    workshopId: string
  ): Promise<boolean> {
    const workshopLink = `${this.appUrl}/workshops/${workshopId}`;

    console.log('\n========================================');
    console.log('📧 WORKSHOP INVITATION');
    console.log('========================================');
    console.log(`To: ${toEmail}`);
    console.log(`From: ${inviterName}`);
    console.log(`Workshop: ${workshopName}`);
    console.log(`\n🔗 WORKSHOP LINK: ${workshopLink}`);
    console.log('========================================\n');

    if (!this.emailEnabled || !this.transporter) {
      console.log('(Email not sent - SMTP not configured. Share the link above manually)');
      return true;
    }

    const mailOptions = {
      from: `"TeamUp" <${this.fromEmail}>`,
      to: toEmail,
      subject: `You've been invited to join "${workshopName}" on TeamUp`,
      html: this.getWorkshopInvitationEmailHtml(inviterName, workshopName, workshopLink),
      text: `You've been invited to join "${workshopName}" on TeamUp!\n\n${inviterName} has invited you to collaborate in their workshop.\n\nClick here to view: ${workshopLink}\n\nLooking forward to having you!`
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      console.log('📋 Share this link manually:', workshopLink);
      return true;
    }
  }

  private getInvitationEmailHtml(inviterName: string, projectTitle: string, inviteLink: string): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Project Invitation</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">TeamUp</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Collaborate. Create. Succeed.</p>
  </div>
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <h2 style="color: #1f2937; margin-top: 0;">You're Invited! 🎉</h2>
    <p style="color: #4b5563;"><strong>${inviterName}</strong> has invited you to join the project:</p>
    <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #6366f1;">
      <h3 style="margin: 0 0 10px 0; color: #1f2937;">${projectTitle}</h3>
      <p style="margin: 0; color: #6b7280; font-size: 14px;">Click the button below to join the team</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Accept Invitation</a>
    </div>
    <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link into your browser:<br><a href="${inviteLink}" style="color: #6366f1; word-break: break-all;">${inviteLink}</a></p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">This invitation will expire in 7 days.<br>If you didn't expect this invitation, you can safely ignore this email.</p>
  </div>
</body>
</html>`;
  }

  private getWorkshopInvitationEmailHtml(inviterName: string, workshopName: string, workshopLink: string): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Workshop Invitation</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">TeamUp</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Collaborate. Create. Succeed.</p>
  </div>
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <h2 style="color: #1f2937; margin-top: 0;">You're Invited to Join a Workshop! 🎉</h2>
    <p style="color: #4b5563;"><strong>${inviterName}</strong> has invited you to join the workshop:</p>
    <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #6366f1;">
      <h3 style="margin: 0 0 10px 0; color: #1f2937;">${workshopName}</h3>
      <p style="margin: 0; color: #6b7280; font-size: 14px;">Click the button below to view the workshop</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${workshopLink}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">View Workshop</a>
    </div>
    <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link into your browser:<br><a href="${workshopLink}" style="color: #6366f1; word-break: break-all;">${workshopLink}</a></p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">If you didn't expect this invitation, you can safely ignore this email.</p>
  </div>
</body>
</html>`;
  }

  private getJoinRequestEmailHtml(requesterName: string, postTitle: string, viewLink: string): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Join Request</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0;">TeamUp</h1>
  </div>
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <h2 style="color: #1f2937; margin-top: 0;">New Join Request 👋</h2>
    <p style="color: #4b5563;"><strong>${requesterName}</strong> wants to join your project:</p>
    <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0; color: #1f2937;">${postTitle}</h3>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${viewLink}" style="display: inline-block; background: #6366f1; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600;">View Request</a>
    </div>
  </div>
</body>
</html>`;
  }

  private getJoinResponseEmailHtml(postTitle: string, isApproved: boolean, projectLink: string): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Join Request ${isApproved ? 'Approved' : 'Update'}</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, ${isApproved ? '#10b981' : '#6366f1'} 0%, ${isApproved ? '#059669' : '#8b5cf6'} 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0;">TeamUp</h1>
  </div>
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <h2 style="color: #1f2937; margin-top: 0;">${isApproved ? 'Welcome to the Team! 🎉' : 'Request Update'}</h2>
    <p style="color: #4b5563;">${isApproved
        ? `Great news! Your request to join <strong>"${postTitle}"</strong> has been approved.`
        : `Unfortunately, your request to join <strong>"${postTitle}"</strong> was not approved at this time.`
      }</p>
    ${isApproved && projectLink ? `<div style="text-align: center; margin: 30px 0;"><a href="${projectLink}" style="display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600;">Go to Project</a></div>` : ''}
    ${!isApproved ? `<p style="color: #6b7280; font-size: 14px;">Don't be discouraged! There are many other great projects looking for collaborators. Check out the community page to find more opportunities.</p>` : ''}
  </div>
</body>
</html>`;
  }
}