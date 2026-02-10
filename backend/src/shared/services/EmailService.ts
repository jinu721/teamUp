import { EmailProvider } from '../providers/EmailProvider';
import {
  projectInvitationTemplate,
  workshopInvitationTemplate,
  joinRequestTemplate,
  joinResponseTemplate
} from '../templates/email';

export class EmailService {
  private appUrl: string;

  constructor(private emailProv: EmailProvider) {
    this.appUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
  }

  async sendProjectInvitation(
    toEmail: string,
    inviterName: string,
    projectTitle: string,
    _projectId: string,
    inviteToken: string
  ): Promise<boolean> {
    const inviteLink = `${this.appUrl}/invite/${inviteToken}`;

    const subject = `Invitation to join project: ${projectTitle}`;
    const html = this.getInvitationEmailHtml(inviterName, projectTitle, inviteLink);

    try {
      await this.emailProv.sendEmail(toEmail, subject, html);
      return true;
    } catch (error) {
      console.error('[EmailService] Error sending project invitation:', error);
      return false;
    }
  }

  async sendJoinRequestNotification(
    toEmail: string,
    requesterName: string,
    postTitle: string,
    postId: string
  ): Promise<boolean> {
    const viewLink = `${this.appUrl}/community?post=${postId}`;

    const subject = `New join request: ${postTitle}`;
    const html = this.getJoinRequestEmailHtml(requesterName, postTitle, viewLink);

    try {
      await this.emailProv.sendEmail(toEmail, subject, html);
      return true;
    } catch (error) {
      console.error('[EmailService] Error sending join request notification:', error);
      return false;
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

    const subject = `Update on your request: ${postTitle}`;
    const html = this.getJoinResponseEmailHtml(postTitle, isApproved, projectLink);

    try {
      await this.emailProv.sendEmail(toEmail, subject, html);
      return true;
    } catch (error) {
      console.error('[EmailService] Error sending join request response:', error);
      return false;
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

    const subject = `Invitation to join workshop: ${workshopName}`;
    const html = this.getWorkshopInvitationEmailHtml(inviterName, workshopName, inviteLink);

    try {
      await this.emailProv.sendEmail(toEmail, subject, html);
      return true;
    } catch (error) {
      console.error('[EmailService] Error sending workshop invitation:', error);
      return false;
    }
  }

  private getInvitationEmailHtml(inviterName: string, projectTitle: string, inviteLink: string): string {
    return projectInvitationTemplate(inviterName, projectTitle, inviteLink);
  }

  private getWorkshopInvitationEmailHtml(inviterName: string, workshopName: string, workshopLink: string): string {
    return workshopInvitationTemplate(inviterName, workshopName, workshopLink);
  }

  private getJoinRequestEmailHtml(requesterName: string, postTitle: string, viewLink: string): string {
    return joinRequestTemplate(requesterName, postTitle, viewLink);
  }

  private getJoinResponseEmailHtml(postTitle: string, isApproved: boolean, projectLink: string): string {
    return joinResponseTemplate(postTitle, isApproved, projectLink);
  }
}