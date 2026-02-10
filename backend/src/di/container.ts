
import { Server as HTTPServer } from 'http';
import { Container } from './types';
import { TokenProvider } from '../shared/providers/TokenProvider';
import { EmailProvider } from '../shared/providers/EmailProvider';
import { HashProvider } from '../shared/providers/HashProvider';
import { ActivityHistoryRepository } from '../modules/audit/repositories/ActivityHistoryRepository';
import { AuditLogRepository } from '../modules/audit/repositories/AuditLogRepository';
import { MembershipRepository } from '../modules/team/repositories/MembershipRepository';
import { InvitationRepository } from '../modules/invitation/repositories/InvitationRepository';
import { NotificationRepository } from '../modules/notification/repositories/NotificationRepository';
import { PasswordResetRepository } from '../modules/auth/repositories/PasswordResetRepository';
import { PendingUserRepository } from '../modules/auth/repositories/PendingUserRepository';
import { RoleAssignmentRepository } from '../modules/access-control/repositories/RoleAssignmentRepository';
import { RoleRepository } from '../modules/access-control/repositories/RoleRepository';
import { TeamRepository } from '../modules/team/repositories/TeamRepository';
import { UserRepository } from '../modules/user/repositories/UserRepository';
import { WorkshopProjectRepository } from '../modules/project/repositories/WorkshopProjectRepository';
import { WorkshopRepository } from '../modules/workshop/repositories/WorkshopRepository';
import { WorkshopTaskRepository } from '../modules/task/repositories/WorkshopTaskRepository';
import { ActivityHistoryService } from '../modules/audit/services/ActivityHistoryService';
import { AuditService } from '../modules/audit/services/AuditService';
import { AuthService } from '../modules/auth/services/AuthService';
import { ChatService } from '../modules/chat/services/ChatService';
import { CloudinaryService } from '../shared/services/CloudinaryService';
import { EmailService } from '../shared/services/EmailService';
import { InvitationService } from '../modules/invitation/services/InvitationService';
import { NotificationService } from '../modules/notification/services/NotificationService';
import { PermissionService } from '../modules/access-control/services/PermissionService';
import { SocketService } from '../socket/SocketService';
import { TeamService } from '../modules/team/services/TeamService';
import { WorkshopProjectService } from '../modules/project/services/WorkshopProjectService';
import { WorkshopService } from '../modules/workshop/services/WorkshopService';
import { WorkshopTaskService } from '../modules/task/services/WorkshopTaskService';
import { ActivityController } from '../modules/audit/controllers/ActivityController';
import { AuditController } from '../modules/audit/controllers/AuditController';
import { AuthController } from '../modules/auth/controllers/AuthController';
import { ChatController } from '../modules/chat/controllers/ChatController';
import { InviteController } from '../modules/invitation/controllers/InviteController';
import { NotificationController } from '../modules/notification/controllers/NotificationController';
import { PermissionController } from '../modules/access-control/controllers/PermissionController';
import { RoleController } from '../modules/access-control/controllers/RoleController';
import { TeamController } from '../modules/team/controllers/TeamController';
import { WorkshopController } from '../modules/workshop/controllers/WorkshopController';
import { WorkshopProjectController } from '../modules/project/controllers/WorkshopProjectController';
import { WorkshopTaskController } from '../modules/task/controllers/WorkshopTaskController';

import { ITokenProvider } from '../shared/interfaces/ITokenProvider';
import { IEmailProvider } from '../shared/interfaces/IEmailProvider';
import { IHashProvider } from '../shared/interfaces/IHashProvider';
import { IActivityHistoryRepository } from '../modules/audit/interfaces/IActivityHistoryRepository';
import { IAuditLogRepository } from '../modules/audit/interfaces/IAuditLogRepository';
import { IMembershipRepository } from '../modules/team/interfaces/IMembershipRepository';
import { INotificationRepository } from '../modules/notification/interfaces/INotificationRepository';
import { IPasswordResetRepository } from '../modules/auth/interfaces/IPasswordResetRepository';
import { IPendingUserRepository } from '../modules/auth/interfaces/IPendingUserRepository';
import { IRoleAssignmentRepository } from '../modules/access-control/interfaces/IRoleAssignmentRepository';
import { IRoleRepository } from '../modules/access-control/interfaces/IRoleRepository';
import { ITeamRepository } from '../modules/team/interfaces/ITeamRepository';
import { IUserRepository } from '../modules/user/interfaces/IUserRepository';
import { IWorkshopProjectRepository } from '../modules/project/interfaces/IWorkshopProjectRepository';
import { IWorkshopRepository } from '../modules/workshop/interfaces/IWorkshopRepository';
import { IWorkshopTaskRepository } from '../modules/task/interfaces/IWorkshopTaskRepository';
import { IActivityHistoryService } from '../modules/audit/interfaces/IActivityHistoryService';
import { IAuditService } from '../modules/audit/interfaces/IAuditService';
import { IAuthService } from '../modules/auth/interfaces/IAuthService';
import { IChatService } from '../modules/chat/interfaces/IChatService';
import { ICloudinaryService } from '../shared/interfaces/ICloudinaryService';
import { IEmailService } from '../shared/interfaces/IEmailService';
import { INotificationService } from '../modules/notification/interfaces/INotificationService';
import { IPermissionService } from '../modules/access-control/interfaces/IPermissionService';
import { ISocketService } from '../shared/interfaces/ISocketService';
import { ITeamService } from '../modules/team/interfaces/ITeamService';
import { IWorkshopProjectService } from '../modules/project/interfaces/IWorkshopProjectService';
import { IWorkshopService } from '../modules/workshop/interfaces/IWorkshopService';
import { IWorkshopTaskService } from '../modules/task/interfaces/IWorkshopTaskService';
import { IInvitationService } from '../modules/invitation/interfaces/IInvitationService';
import { IInvitationRepository } from '../modules/invitation/interfaces/IInvitationRepository';

export class DIContainer implements Container {
    public tokenProv: ITokenProvider;
    public emailProv: IEmailProvider;
    public hashProv: IHashProvider;

    public activityHistoryRepo: IActivityHistoryRepository;
    public auditLogRepo: IAuditLogRepository;
    public membershipRepo: IMembershipRepository;
    public notificationRepo: INotificationRepository;
    public passwordResetRepo: IPasswordResetRepository;
    public pendingUserRepo: IPendingUserRepository;
    public roleAssignmentRepo: IRoleAssignmentRepository;
    public invitationRepo: IInvitationRepository;
    public roleRepo: IRoleRepository;
    public teamRepo: ITeamRepository;
    public userRepo: IUserRepository;
    public workshopProjectRepo: IWorkshopProjectRepository;
    public workshopRepo: IWorkshopRepository;
    public workshopTaskRepo: IWorkshopTaskRepository;

    public activityHistorySrv: IActivityHistoryService;
    public auditSrv: IAuditService;
    public authSrv: IAuthService;
    public chatSrv: IChatService;
    public cloudinarySrv: ICloudinaryService;
    public emailSrv: IEmailService;
    public invitationSrv: IInvitationService;
    public notificationSrv: INotificationService;
    public permissionSrv: IPermissionService;
    public socketSrv: ISocketService;
    public teamSrv: ITeamService;
    public workshopProjectSrv: IWorkshopProjectService;
    public workshopSrv: IWorkshopService;
    public workshopTaskSrv: IWorkshopTaskService;

    public activityCtrl: ActivityController;
    public auditCtrl: AuditController;
    public authCtrl: AuthController;
    public chatCtrl: ChatController;
    public inviteCtrl: InviteController;
    public notificationCtrl: NotificationController;
    public permissionCtrl: PermissionController;
    public roleCtrl: RoleController;
    public teamCtrl: TeamController;
    public workshopCtrl: WorkshopController;
    public workshopProjectCtrl: WorkshopProjectController;
    public workshopTaskCtrl: WorkshopTaskController;

    constructor(httpServer: HTTPServer) {
        this.tokenProv = new TokenProvider();
        this.emailProv = new EmailProvider();
        this.hashProv = new HashProvider();

        this.activityHistoryRepo = new ActivityHistoryRepository();
        this.auditLogRepo = new AuditLogRepository();
        this.membershipRepo = new MembershipRepository();
        this.notificationRepo = new NotificationRepository();
        this.passwordResetRepo = new PasswordResetRepository();
        this.pendingUserRepo = new PendingUserRepository();
        this.roleAssignmentRepo = new RoleAssignmentRepository();
        this.invitationRepo = new InvitationRepository();
        this.roleRepo = new RoleRepository();
        this.teamRepo = new TeamRepository();
        this.userRepo = new UserRepository();
        this.workshopProjectRepo = new WorkshopProjectRepository();
        this.workshopRepo = new WorkshopRepository();
        this.workshopTaskRepo = new WorkshopTaskRepository();

        this.activityHistorySrv = new ActivityHistoryService(this.activityHistoryRepo);
        this.auditSrv = new AuditService(this.auditLogRepo);
        this.authSrv = new AuthService(
            this.userRepo,
            this.pendingUserRepo,
            this.passwordResetRepo,
            this.tokenProv,
            this.emailProv,
            this.hashProv
        );

        this.socketSrv = new SocketService(
            httpServer,
            this.userRepo,
            this.tokenProv
        );

        this.cloudinarySrv = new CloudinaryService();
        this.emailSrv = new EmailService(this.emailProv);
        this.notificationSrv = new NotificationService(
            this.notificationRepo,
            this.socketSrv
        );
        this.permissionSrv = new PermissionService(
            this.roleAssignmentRepo,
            this.workshopRepo,
            this.teamRepo,
            this.membershipRepo,
            this.workshopProjectRepo
        );
        this.chatSrv = new ChatService(
            this.activityHistorySrv,
            this.workshopRepo,
            this.teamRepo,
            this.workshopProjectRepo,
            this.membershipRepo,
            this.socketSrv
        );
        this.teamSrv = new TeamService(
            this.teamRepo,
            this.membershipRepo,
            this.workshopRepo,
            this.auditSrv,
            this.permissionSrv,
            this.chatSrv,
            this.socketSrv
        );
        this.workshopProjectSrv = new WorkshopProjectService(
            this.workshopProjectRepo,
            this.workshopRepo,
            this.teamRepo,
            this.auditSrv,
            this.permissionSrv,
            this.chatSrv,
            this.socketSrv
        );
        this.workshopSrv = new WorkshopService(
            this.workshopRepo,
            this.membershipRepo,
            this.teamRepo,
            this.roleRepo,
            this.roleAssignmentRepo,
            this.workshopProjectRepo,
            this.auditSrv,
            this.permissionSrv,
            this.emailSrv,
            this.chatSrv,
            this.socketSrv
        );

        this.workshopTaskSrv = new WorkshopTaskService(
            this.workshopTaskRepo,
            this.workshopProjectRepo,
            this.membershipRepo,
            this.teamRepo,
            this.notificationRepo,
            this.auditSrv,
            this.permissionSrv,
            this.socketSrv
        );

        this.invitationSrv = new InvitationService(
            this.invitationRepo,
            this.workshopSrv,
            this.userRepo
        );

        this.activityCtrl = new ActivityController(this.activityHistorySrv);
        this.auditCtrl = new AuditController(this.auditSrv, this.workshopRepo);
        this.authCtrl = new AuthController(this.authSrv);
        this.chatCtrl = new ChatController(
            this.chatSrv,
            this.cloudinarySrv,
            this.permissionSrv
        );
        this.chatCtrl.setSocketService(this.socketSrv);

        this.inviteCtrl = new InviteController(
            this.invitationSrv
        );
        this.notificationCtrl = new NotificationController(this.notificationSrv);
        this.permissionCtrl = new PermissionController(this.permissionSrv);
        this.roleCtrl = new RoleController(
            this.roleRepo,
            this.roleAssignmentRepo,
            this.workshopRepo,
            this.auditSrv,
            this.permissionSrv
        );
        this.roleCtrl.setSocketService(this.socketSrv);

        this.teamCtrl = new TeamController(this.teamSrv);
        this.teamCtrl.setSocketService(this.socketSrv);

        this.workshopCtrl = new WorkshopController(this.workshopSrv);
        this.workshopCtrl.setSocketService(this.socketSrv);

        this.workshopProjectCtrl = new WorkshopProjectController(this.workshopProjectSrv);
        this.workshopProjectCtrl.setSocketService(this.socketSrv);

        this.workshopTaskCtrl = new WorkshopTaskController(this.workshopTaskSrv);
        this.workshopTaskCtrl.setSocketService(this.socketSrv);
    }
}
