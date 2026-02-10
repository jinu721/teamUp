export interface IEmailService {
    sendProjectInvitation(
        toEmail: string,
        inviterName: string,
        projectTitle: string,
        projectId: string,
        inviteToken: string
    ): Promise<boolean>;
    sendJoinRequestNotification(
        toEmail: string,
        requesterName: string,
        postTitle: string,
        postId: string
    ): Promise<boolean>;
    sendJoinRequestResponse(
        toEmail: string,
        postTitle: string,
        status: 'approved' | 'rejected',
        projectId?: string
    ): Promise<boolean>;
    sendWorkshopInvitation(
        toEmail: string,
        inviterName: string,
        workshopName: string,
        workshopId: string,
        token: string
    ): Promise<boolean>;
}
