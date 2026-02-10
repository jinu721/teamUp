import * as Repos from "../repositories";
import * as Services from "../services";
import * as Controllers from "../controllers";
import * as Providers from "../providers";

export interface Container {
    tokenProv: Providers.TokenProvider;
    emailProv: Providers.EmailProvider;
    hashProv: Providers.HashProvider;

    activityHistoryRepo: Repos.ActivityHistoryRepository;
    auditLogRepo: Repos.AuditLogRepository;
    membershipRepo: Repos.MembershipRepository;
    notificationRepo: Repos.NotificationRepository;
    passwordResetRepo: Repos.PasswordResetRepository;
    pendingUserRepo: Repos.PendingUserRepository;
    roleAssignmentRepo: Repos.RoleAssignmentRepository;
    roleRepo: Repos.RoleRepository;
    teamRepo: Repos.TeamRepository;
    userRepo: Repos.UserRepository;
    workshopProjectRepo: Repos.WorkshopProjectRepository;
    workshopRepo: Repos.WorkshopRepository;
    workshopTaskRepo: Repos.WorkshopTaskRepository;

    activityHistorySrv: Services.ActivityHistoryService;
    auditSrv: Services.AuditService;
    authSrv: Services.AuthService;
    chatSrv: Services.ChatService;
    cloudinarySrv: Services.CloudinaryService;
    emailSrv: Services.EmailService;
    notificationSrv: Services.NotificationService;
    permissionSrv: Services.PermissionService;
    socketSrv: Services.SocketService;
    teamSrv: Services.TeamService;
    workshopProjectSrv: Services.WorkshopProjectService;
    workshopSrv: Services.WorkshopService;
    workshopTaskSrv: Services.WorkshopTaskService;

    activityCtrl: Controllers.ActivityController;
    auditCtrl: Controllers.AuditController;
    authCtrl: Controllers.AuthController;
    chatCtrl: Controllers.ChatController;
    inviteCtrl: Controllers.InviteController;
    notificationCtrl: Controllers.NotificationController;
    permissionCtrl: Controllers.PermissionController;
    roleCtrl: Controllers.RoleController;
    teamCtrl: Controllers.TeamController;
    workshopCtrl: Controllers.WorkshopController;
    workshopProjectCtrl: Controllers.WorkshopProjectController;
    workshopTaskCtrl: Controllers.WorkshopTaskController;
}
