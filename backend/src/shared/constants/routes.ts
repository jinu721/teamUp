export const API_PREFIX = '/api';

export const MODULE_BASE = {
    AUTH: '/auth',
    NOTIFICATIONS: '/notifications',
    WORKSHOPS: '/workshops',
    PERMISSION_CHECK: '/workshops/:workshopId/permissions',
    CHAT: '/chat',
    INVITES: '/invites',
    ACTIVITY: '/',
    TASKS: '/workshop-tasks',
    USER_TASKS: '/users',
    TEAM_TASKS: '/teams',
    AUDIT: '/workshops/:workshopId/audit',
    ROLES: '/workshops/:workshopId/roles',
    TEAMS: '/workshops/:workshopId/teams',
    PROJECTS: '/workshops/:workshopId/projects',
    PROJECT_TASKS: '/workshops/:workshopId/projects/:projectId/tasks'
};

export const AUTH_ROUTES = {
    REGISTER: '/register',
    VERIFY_OTP: '/verify-otp',
    RESEND_OTP: '/resend-otp',
    LOGIN: '/login',
    REFRESH_TOKEN: '/refresh-token',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    ME: '/me',
    PROFILE: '/profile',
    GOOGLE: '/google',
    GOOGLE_CALLBACK: '/google/callback',
    GITHUB: '/github',
    GITHUB_CALLBACK: '/github/callback'
};

export const WORKSHOP_ROUTES = {
    BASE: '/',
    MY_WORKSHOPS: '/my-workshops',
    PUBLIC: '/public',
    UPVOTE: '/:workshopId/upvote',
    DOWNVOTE: '/:workshopId/downvote',
    CHECK_PERMISSION: '/:workshopId/permissions/check',
    BY_ID: '/:workshopId',
    MEMBERS: '/:workshopId/members',
    PENDING_REQUESTS: '/:workshopId/pending-requests',
    INVITE: '/:workshopId/invite',
    JOIN: '/:workshopId/join',
    APPROVE_REQUEST: '/:workshopId/approve/:membershipId',
    REJECT_REQUEST: '/:workshopId/reject/:membershipId',
    REVOKE_MEMBERSHIP: '/:workshopId/members/:userId',
    LEAVE: '/:workshopId/leave',
    ASSIGN_MANAGER: '/:workshopId/managers/:managerId',
    REMOVE_MANAGER: '/:workshopId/managers/:managerId'
};

export const NOTIFICATION_ROUTES = {
    BASE: '/',
    UNREAD: '/unread',
    COUNT: '/count',
    MARK_READ: '/:id/read',
    MARK_ALL_READ: '/read-all',
    DELETE: '/:id'
};

export const TEAM_ROUTES = {
    BASE: '/',
    BY_ID: '/:id',
    MEMBERS: '/:id/members',
    MEMBER_BY_ID: '/:id/members/:userId',
    USER_TEAMS: '/user/:userId'
};

export const ROLE_ROUTES = {
    BASE: '/',
    BY_ID: '/:id',
    ASSIGN: '/:id/assign',
    REVOKE: '/:id/assign/:userId',
    USER_ROLES: '/user/:userId'
};

export const PERMISSION_ROUTES = {
    CHECK: '/check'
};

export const PROJECT_ROUTES = {
    BASE: '/',
    ACCESSIBLE: '/accessible',
    BY_ID: '/:projectId',
    TEAMS: '/:projectId/teams',
    TEAM_BY_ID: '/:projectId/teams/:teamId',
    INDIVIDUALS: '/:projectId/individuals',
    INDIVIDUAL_BY_ID: '/:projectId/individuals/:userId',
    MANAGER: '/:projectId/manager',
    MAINTAINERS: '/:projectId/maintainers',
    MAINTAINER_BY_ID: '/:projectId/maintainers/:maintainerId'
};

export const TASK_ROUTES = {
    BASE: '/',
    BOARD: '/board',
    BY_ID: '/:taskId',
    STATUS: '/:taskId/status',
    COMMENTS: '/:taskId/comments',
    ATTACHMENTS: '/:taskId/attachments',
    TEAMS: '/:taskId/teams',
    INDIVIDUALS: '/:taskId/individuals',
    ACTIVITY: '/:taskId/activity',
    MY_TASKS: '/my-tasks',
    TEAM_TASKS: '/:teamId/tasks'
};

export const AUDIT_ROUTES = {
    BASE: '/',
    RECENT: '/recent',
    STATS: '/stats',
    USER_ACTIVITY: '/user/:targetUserId',
    USER_SUMMARY: '/user/:targetUserId/summary',
    TARGET: '/target/:targetId'
};

export const ACTIVITY_ROUTES = {
    WORKSHOP_ACTIVITY: '/workshops/:workshopId/activity',
    WORKSHOP_STATS: '/workshops/:workshopId/activity/stats',
    USER_ACTIVITY: '/users/:userId/activity',
    ENTITY_ACTIVITY: '/activity/:entityType/:entityId',
    RECENT: '/activity/recent'
};

export const CHAT_ROUTES = {
    WORKSHOP_ROOMS: '/workshops/:workshopId/chat/rooms',
    DIRECT: '/workshops/:workshopId/chat/direct',
    BY_ID: '/rooms/:roomId',
    MESSAGES: '/rooms/:roomId/messages',
    MESSAGE_BY_ID: '/messages/:messageId',
    MESSAGE_SEEN: '/messages/:messageId/seen',
    ROOM_SEEN: '/rooms/:roomId/seen',
    ROOM_UNREAD: '/rooms/:roomId/unread',
    REACTIONS: '/messages/:messageId/reactions',
    SEARCH: '/rooms/:roomId/search',
    UPLOAD: '/upload',
    UPLOAD_ONLY: '/upload-only'
};

export const INVITE_ROUTES = {
    BY_TOKEN: '/:token',
    ACCEPT: '/:token/accept'
};
