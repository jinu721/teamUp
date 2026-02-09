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
    this.appUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
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
      console.log('[EmailService] Service initialized with Gmail:', emailUser);
    } else {
      console.log('[EmailService] Service running in console-only mode (no credentials found)');
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

    console.log('\n----------------------------------------');
    console.log('PROJECT INVITATION');
    console.log('----------------------------------------');
    console.log(`To: ${toEmail}`);
    console.log(`From: ${inviterName}`);
    console.log(`Project: ${projectTitle}`);
    console.log(`Link: ${inviteLink}`);
    console.log('----------------------------------------\n');

    if (!this.emailEnabled || !this.transporter) {
      console.log('[EmailService] SMTP not configured. Share link manually.');
      return true;
    }

    const mailOptions = {
      from: `"TeamUp" <${this.fromEmail}>`,
      to: toEmail,
      subject: `Invitation to join project: ${projectTitle}`,
      html: this.getInvitationEmailHtml(inviterName, projectTitle, inviteLink),
      text: `You have been invited to join project "${projectTitle}" on TeamUp.\n\n${inviterName} has invited you to collaborate.\n\nAccept invitation: ${inviteLink}\n\nThis invitation will expire in 7 days.`
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('[EmailService] Message sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('[EmailService] Error sending email:', error);
      console.log('[EmailService] Manual link share required:', inviteLink);
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

    console.log('\n----------------------------------------');
    console.log('JOIN REQUEST NOTIFICATION');
    console.log('----------------------------------------');
    console.log(`To: ${toEmail}`);
    console.log(`Requester: ${requesterName}`);
    console.log(`Post: ${postTitle}`);
    console.log(`Link: ${viewLink}`);
    console.log('----------------------------------------\n');

    if (!this.emailEnabled || !this.transporter) {
      return true;
    }

    const mailOptions = {
      from: `"TeamUp" <${this.fromEmail}>`,
      to: toEmail,
      subject: `New join request: ${postTitle}`,
      html: this.getJoinRequestEmailHtml(requesterName, postTitle, viewLink),
      text: `${requesterName} has requested to join your project "${postTitle}". View the request here: ${viewLink}`
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('[EmailService] Error sending notification:', error);
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

    console.log('\n----------------------------------------');
    console.log(`JOIN REQUEST ${status.toUpperCase()}`);
    console.log('----------------------------------------');
    console.log(`To: ${toEmail}`);
    console.log(`Post: ${postTitle}`);
    if (projectLink) console.log(`Link: ${projectLink}`);
    console.log('----------------------------------------\n');

    if (!this.emailEnabled || !this.transporter) {
      return true;
    }

    const mailOptions = {
      from: `"TeamUp" <${this.fromEmail}>`,
      to: toEmail,
      subject: `Update on your request: ${postTitle}`,
      html: this.getJoinResponseEmailHtml(postTitle, isApproved, projectLink),
      text: isApproved
        ? `Your request to join "${postTitle}" was approved. ${projectLink ? `View project: ${projectLink}` : ''}`
        : `Your request to join "${postTitle}" was not approved at this time.`
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('[EmailService] Error sending response:', error);
      return true;
    }
  }

  async sendWorkshopInvitation(
    toEmail: string,
    inviterName: string,
    workshopName: string,
    _workshopId: string,
    token: string
  ): Promise<boolean> {
    const inviteLink = `${this.appUrl}/invite/${token}`;

    console.log('\n----------------------------------------');
    console.log('WORKSHOP INVITATION');
    console.log('----------------------------------------');
    console.log(`To: ${toEmail}`);
    console.log(`From: ${inviterName}`);
    console.log(`Workshop: ${workshopName}`);
    console.log(`Link: ${inviteLink}`);
    console.log('----------------------------------------\n');

    if (!this.emailEnabled || !this.transporter) {
      console.log('[EmailService] SMTP not configured. Share link manually.');
      return true;
    }

    const mailOptions = {
      from: `"TeamUp" <${this.fromEmail}>`,
      to: toEmail,
      subject: `Invitation to join workshop: ${workshopName}`,
      html: this.getWorkshopInvitationEmailHtml(inviterName, workshopName, inviteLink),
      text: `You have been invited to join workshop "${workshopName}" on TeamUp.\n\n${inviterName} has invited you to collaborate.\n\nAccept invitation: ${inviteLink}`
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('[EmailService] Message sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('[EmailService] Error sending email:', error);
      console.log('[EmailService] Manual link share required:', inviteLink);
      return true;
    }
  }

  private getInvitationEmailHtml(inviterName: string, projectTitle: string, inviteLink: string): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Invitation</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #111827; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
  <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 40px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
    <div style="margin-bottom: 24px; border-bottom: 1px solid #f3f4f6; padding-bottom: 24px;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #111827;">TeamUp</h1>
    </div>
    <h2 style="font-size: 16px; font-weight: 600; color: #374151; margin-top: 0; margin-bottom: 16px;">Project Invitation</h2>
    <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 14px;">${inviterName} has invited you to collaborate on the project:</p>
    <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0; font-weight: 600; font-size: 15px; color: #111827;">${projectTitle}</p>
    </div>
    <a href="${inviteLink}" style="display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 500;">Accept Invitation</a>
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #f3f4f6;">
      <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.6;">
        If you did not expect this invitation, you can safely ignore this email.<br>
        Link: <a href="${inviteLink}" style="color: #6366f1; text-decoration: none;">${inviteLink}</a>
      </p>
    </div>
  </div>
</body>
</html>`;
  }

  private getWorkshopInvitationEmailHtml(inviterName: string, workshopName: string, workshopLink: string): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Invitation</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #111827; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
  <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 40px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
    <div style="margin-bottom: 24px; border-bottom: 1px solid #f3f4f6; padding-bottom: 24px;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #111827;">TeamUp</h1>
    </div>
    <h2 style="font-size: 16px; font-weight: 600; color: #374151; margin-top: 0; margin-bottom: 16px;">Workshop Invitation</h2>
    <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 14px;">${inviterName} has invited you to join the workshop:</p>
    <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0; font-weight: 600; font-size: 15px; color: #111827;">${workshopName}</p>
    </div>
    <a href="${workshopLink}" style="display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 500;">Accept Invitation</a>
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #f3f4f6;">
      <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.6;">
        If you did not expect this invitation, you can safely ignore this email.
      </p>
    </div>
  </div>
</body>
</html>`;
  }

  private getJoinRequestEmailHtml(requesterName: string, postTitle: string, viewLink: string): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Join Request</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #111827; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
  <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 40px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
    <div style="margin-bottom: 24px; border-bottom: 1px solid #f3f4f6; padding-bottom: 24px;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #111827;">TeamUp</h1>
    </div>
    <h2 style="font-size: 16px; font-weight: 600; color: #374151; margin-top: 0; margin-bottom: 16px;">New Join Request</h2>
    <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 14px;">${requesterName} has requested to join your project:</p>
    <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0; font-weight: 600; font-size: 15px; color: #111827;">${postTitle}</p>
    </div>
    <a href="${viewLink}" style="display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 500;">View Request</a>
  </div>
</body>
</html>`;
  }

  private getJoinResponseEmailHtml(postTitle: string, isApproved: boolean, projectLink: string): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Request Update</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #111827; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
  <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 40px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
    <div style="margin-bottom: 24px; border-bottom: 1px solid #f3f4f6; padding-bottom: 24px;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #111827;">TeamUp</h1>
    </div>
    <h2 style="font-size: 16px; font-weight: 600; color: #374151; margin-top: 0; margin-bottom: 16px;">Request Update</h2>
    <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 14px;">
      ${isApproved
        ? `Your request to join "${postTitle}" has been approved.`
        : `Your request to join "${postTitle}" was not approved at this time.`
      }
    </p>
    ${isApproved && projectLink ? `
    <div style="margin: 24px 0;">
      <a href="${projectLink}" style="display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 500;">Go to Project</a>
    </div>` : ''}
    ${!isApproved ? `
    <p style="margin-top: 24px; font-size: 13px; color: #6b7280;">
      Feel free to explore other projects looking for collaborators on the community page.
    </p>` : ''}
  </div>
</body>
</html>`;
  }
}