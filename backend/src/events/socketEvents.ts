export const SocketEvents = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',

  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',

  PROJECT_JOIN: 'project:join',
  PROJECT_LEAVE: 'project:leave',
  PROJECT_UPDATED: 'project:updated',

  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_DELETED: 'task:deleted',
  TASK_MOVED: 'task:moved',

  MESSAGE_SEND: 'message:send',
  MESSAGE_NEW: 'message:new',

  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',

  COMMUNITY_JOIN: 'community:join',
  COMMUNITY_LEAVE: 'community:leave',
  COMMUNITY_PROJECT_NEW: 'community:project:new',
  COMMUNITY_PROJECT_LIKED: 'community:project:liked',
  COMMUNITY_PROJECT_COMMENTED: 'community:project:commented',
  COMMUNITY_PROJECT_JOIN_REQUEST: 'community:project:join-request',

  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_READ: 'notification:read'
} as const;

export type SocketEventType = typeof SocketEvents[keyof typeof SocketEvents];