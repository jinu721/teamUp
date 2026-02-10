import { Server as HTTPServer } from 'http';
import { Container } from './types';
import * as Repos from '../repositories';
import * as Services from '../services';
import * as Controllers from '../controllers';
import * as Providers from '../providers';

export class DIContainer implements Container {
    public tokenProv: Providers.TokenProvider;
    public emailProv: Providers.EmailProvider;
    public hashProv: Providers.HashProvider;

    public activityHistoryRepo: Repos.ActivityHistoryRepository;
    public auditLogRepo: Repos.AuditLogRepository;
    public membershipRepo: Repos.MembershipRepository;
    public notificationRepo: Repos.NotificationRepository;
    public passwordResetRepo: Repos.PasswordResetRepository;
    public pendingUserRepo: Repos.PendingUserRepository;
    public roleAssignmentRepo: Repos.RoleAssignmentRepository;
    public roleRepo: Repos.RoleRepository;
    public teamRepo: Repos.TeamRepository;
    public userRepo: Repos.UserRepository;
    public workshopProjectRepo: Repos.WorkshopProjectRepository;
    public workshopRepo: Repos.WorkshopRepository;
    public workshopTaskRepo: Repos.WorkshopTaskRepository;

    public activityHistorySrv: Services.ActivityHistoryService;
    public auditSrv: Services.AuditService;
    public authSrv: Services.AuthService;
    public chatSrv: Services.ChatService;
    public cloudinarySrv: Services.CloudinaryService;
    public emailSrv: Services.EmailService;
    public notificationSrv: Services.NotificationService;
    public permissionSrv: Services.PermissionService;
    public socketSrv: Services.SocketService;
    public teamSrv: Services.TeamService;
    public workshopProjectSrv: Services.WorkshopProjectService;
    public workshopSrv: Services.WorkshopService;
    public workshopTaskSrv: Services.WorkshopTaskService;

    public activityCtrl: Controllers.ActivityController;
    public auditCtrl: Controllers.AuditController;
    public authCtrl: Controllers.AuthController;
    public chatCtrl: Controllers.ChatController;
    public inviteCtrl: Controllers.InviteController;
    public notificationCtrl: Controllers.NotificationController;
    public permissionCtrl: Controllers.PermissionController;
    public roleCtrl: Controllers.RoleController;
    public teamCtrl: Controllers.TeamController;
    public workshopCtrl: Controllers.WorkshopController;
    public workshopProjectCtrl: Controllers.WorkshopProjectController;
    public workshopTaskCtrl: Controllers.WorkshopTaskController;

    constructor(httpServer: HTTPServer) {
        this.tokenProv = new Providers.TokenProvider();
        this.emailProv = new Providers.EmailProvider();
        this.hashProv = new Providers.HashProvider();

        this.activityHistoryRepo = new Repos.ActivityHistoryRepository();
        this.auditLogRepo = new Repos.AuditLogRepository();
        this.membershipRepo = new Repos.MembershipRepository();
        this.notificationRepo = new Repos.NotificationRepository();
        this.passwordResetRepo = new Repos.PasswordResetRepository();
        this.pendingUserRepo = new Repos.PendingUserRepository();
        this.roleAssignmentRepo = new Repos.RoleAssignmentRepository();
        this.roleRepo = new Repos.RoleRepository();
        this.teamRepo = new Repos.TeamRepository();
        this.userRepo = new Repos.UserRepository();
        this.workshopProjectRepo = new Repos.WorkshopProjectRepository();
        this.workshopRepo = new Repos.WorkshopRepository();
        this.workshopTaskRepo = new Repos.WorkshopTaskRepository();

        this.activityHistorySrv = new Services.ActivityHistoryService(this.activityHistoryRepo);
        this.auditSrv = new Services.AuditService(this.auditLogRepo);
        this.authSrv = new Services.AuthService(
            this.userRepo,
            this.pendingUserRepo,
            this.passwordResetRepo,
            this.tokenProv,
            this.emailProv,
            this.hashProv
        );

        this.socketSrv = new Services.SocketService(
            httpServer,
            this.userRepo,
            this.tokenProv
        );

        this.chatSrv = new Services.ChatService(
            this.activityHistorySrv,
            this.workshopRepo,
            this.socketSrv
        );
        this.cloudinarySrv = new Services.CloudinaryService();
        this.emailSrv = new Services.EmailService(this.emailProv);
        this.notificationSrv = new Services.NotificationService(
            this.notificationRepo,
            this.socketSrv
        );
        this.permissionSrv = new Services.PermissionService(
            this.roleAssignmentRepo,
            this.workshopRepo,
            this.teamRepo,
            this.membershipRepo,
            this.workshopProjectRepo
        );
        this.teamSrv = new Services.TeamService(
            this.teamRepo,
            this.membershipRepo,
            this.workshopRepo,
            this.auditSrv,
            this.permissionSrv,
            this.chatSrv,
            this.socketSrv
        );
        this.workshopProjectSrv = new Services.WorkshopProjectService(
            this.workshopProjectRepo,
            this.workshopRepo,
            this.teamRepo,
            this.auditSrv,
            this.permissionSrv,
            this.chatSrv, 
            this.socketSrv
        );
        this.workshopSrv = new Services.WorkshopService(
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

        this.workshopTaskSrv = new Services.WorkshopTaskService(
            this.workshopTaskRepo,
            this.workshopProjectRepo,
            this.membershipRepo,
            this.teamRepo,
            this.notificationRepo,
            this.auditSrv,
            this.permissionSrv,
            this.socketSrv
        );

        this.activityCtrl = new Controllers.ActivityController(this.activityHistorySrv);
        this.auditCtrl = new Controllers.AuditController(this.auditSrv, this.workshopRepo);
        this.authCtrl = new Controllers.AuthController(this.authSrv);
        this.chatCtrl = new Controllers.ChatController(
            this.chatSrv,
            this.cloudinarySrv,
            this.permissionSrv
        );
        this.chatCtrl.setSocketService(this.socketSrv);

        this.inviteCtrl = new Controllers.InviteController(
            this.workshopSrv,
            this.userRepo
        );
        this.notificationCtrl = new Controllers.NotificationController(this.notificationSrv);
        this.permissionCtrl = new Controllers.PermissionController(this.permissionSrv);
        this.roleCtrl = new Controllers.RoleController(
            this.roleRepo,
            this.roleAssignmentRepo,
            this.workshopRepo,
            this.auditSrv,
            this.permissionSrv
        );
        this.roleCtrl.setSocketService(this.socketSrv);

        this.teamCtrl = new Controllers.TeamController(this.teamSrv);
        this.teamCtrl.setSocketService(this.socketSrv);

        this.workshopCtrl = new Controllers.WorkshopController(this.workshopSrv);
        this.workshopCtrl.setSocketService(this.socketSrv);

        this.workshopProjectCtrl = new Controllers.WorkshopProjectController(this.workshopProjectSrv);
        this.workshopProjectCtrl.setSocketService(this.socketSrv);

        this.workshopTaskCtrl = new Controllers.WorkshopTaskController(this.workshopTaskSrv);
        this.workshopTaskCtrl.setSocketService(this.socketSrv);
    }
}
