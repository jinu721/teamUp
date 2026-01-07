// Socket hooks
export {
  useSocketEvent,
  useSocketEvents,
  useProjectRoom,
  useCommunityRoom,
  useTypingIndicator,
  useSocketStatus
} from './useSocket';

// Data hooks
export { useCommunityPosts } from './useCommunityPosts';
export { useNotifications, useUnreadCount } from './useNotifications';

// Workshop hooks
export { useWorkshops, useWorkshop, useWorkshopRoom } from './useWorkshops';
export { useMemberships, useUserMembership } from './useMembership';
export { useTeams, useTeam, useTeamRoom } from './useTeams';
export { useRoles, useRole } from './useRoles';
export { usePermission, usePermissions, clearPermissionCache } from './usePermission';
export { useWorkshopProjects, useWorkshopProject } from './useWorkshopProjects';
export { useWorkshopTasks, useWorkshopTask, useTaskActivity } from './useWorkshopTasks';
export { useAuditLogs } from './useAuditLogs';

// Utility hooks
export { useInfiniteScroll, useScrollNearBottom } from './useInfiniteScroll';
export { useToast } from './use-toast';
