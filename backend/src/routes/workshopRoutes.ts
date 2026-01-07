import { Router } from 'express';
import { WorkshopController } from '../controllers/WorkshopController';
import { WorkshopProjectController } from '../controllers/WorkshopProjectController';
import { WorkshopTaskController } from '../controllers/WorkshopTaskController';
import { TeamController } from '../controllers/TeamController';
import { authenticate } from '../middlewares/auth';
import { requireWorkshopMembership, requirePermission } from '../middlewares/permission';

const router = Router();

// Controllers
export const workshopController = new WorkshopController();
export const projectController = new WorkshopProjectController();
export const taskController = new WorkshopTaskController();
export const teamController = new TeamController();

// ============================================
// WORKSHOP ROUTES
// ============================================

router.post('/', authenticate, workshopController.createWorkshop);
router.get('/my-workshops', authenticate, workshopController.getUserWorkshops);
router.get('/public', workshopController.getPublicWorkshops);
router.post('/:workshopId/upvote', authenticate, workshopController.upvoteWorkshop);
router.post('/:workshopId/downvote', authenticate, workshopController.downvoteWorkshop);
router.get('/:workshopId/permissions/check', authenticate, workshopController.checkPermission);
router.get('/:workshopId', authenticate, requireWorkshopMembership, workshopController.getWorkshop);
router.put('/:workshopId', authenticate, requirePermission('update', 'workshop'), workshopController.updateWorkshop);
router.delete('/:workshopId', authenticate, requirePermission('delete', 'workshop'), workshopController.deleteWorkshop);

// ============================================
// MEMBERSHIP ROUTES
// ============================================

router.get('/:workshopId/members', authenticate, requireWorkshopMembership, workshopController.getMembers);
router.get('/:workshopId/pending-requests', authenticate, requirePermission('manage', 'membership'), workshopController.getPendingRequests);
router.post('/:workshopId/invite', authenticate, requirePermission('invite', 'membership'), workshopController.inviteMember);
router.post('/:workshopId/join', authenticate, workshopController.handleJoinRequest);
router.post('/:workshopId/approve/:membershipId', authenticate, requirePermission('approve', 'membership'), workshopController.approveJoinRequest);
router.post('/:workshopId/reject/:membershipId', authenticate, requirePermission('reject', 'membership'), workshopController.rejectJoinRequest);
router.delete('/:workshopId/members/:userId', authenticate, requirePermission('revoke', 'membership'), workshopController.revokeMembership);
router.post('/:workshopId/leave', authenticate, requireWorkshopMembership, workshopController.leaveWorkshop);

// ============================================
// MANAGER ROUTES
// ============================================

router.post('/:workshopId/managers/:managerId', authenticate, requirePermission('assign_manager', 'workshop'), workshopController.assignManager);
router.delete('/:workshopId/managers/:managerId', authenticate, requirePermission('remove_manager', 'workshop'), workshopController.removeManager);

// ============================================
// TEAM ROUTES
// ============================================

router.get('/:workshopId/teams', authenticate, requireWorkshopMembership, teamController.getWorkshopTeams);
router.post('/:workshopId/teams', authenticate, requirePermission('create', 'team'), teamController.createTeam);
router.get('/:workshopId/teams/:teamId', authenticate, requireWorkshopMembership, teamController.getTeam);
router.put('/:workshopId/teams/:teamId', authenticate, requirePermission('update', 'team'), teamController.updateTeam);
router.delete('/:workshopId/teams/:teamId', authenticate, requirePermission('delete', 'team'), teamController.deleteTeam);
router.post('/:workshopId/teams/:teamId/members/:userId', authenticate, requirePermission('manage', 'team'), teamController.addMember);
router.delete('/:workshopId/teams/:teamId/members/:userId', authenticate, requirePermission('manage', 'team'), teamController.removeMember);
router.get('/:workshopId/teams/:teamId/tasks', authenticate, requireWorkshopMembership, taskController.getTeamTasks);

// ============================================
// PROJECT ROUTES
// ============================================

router.get('/:workshopId/projects', authenticate, requireWorkshopMembership, projectController.getProjects);
router.post('/:workshopId/projects', authenticate, requirePermission('create', 'project'), projectController.createProject);
router.get('/:workshopId/projects/:projectId', authenticate, requireWorkshopMembership, projectController.getProject);
router.put('/:workshopId/projects/:projectId', authenticate, requirePermission('update', 'project'), projectController.updateProject);
router.delete('/:workshopId/projects/:projectId', authenticate, requirePermission('delete', 'project'), projectController.deleteProject);

// ============================================
// PROJECT ASSIGNMENT & ROLE ROUTES
// ============================================

// Teams & Individuals
router.post('/:workshopId/projects/:projectId/teams', authenticate, requirePermission('assign', 'project'), projectController.assignTeam);
router.delete('/:workshopId/projects/:projectId/teams/:teamId', authenticate, requirePermission('assign', 'project'), projectController.removeTeam);
router.post('/:workshopId/projects/:projectId/individuals', authenticate, requirePermission('assign', 'project'), projectController.assignIndividual);
router.delete('/:workshopId/projects/:projectId/individuals/:individualId', authenticate, requirePermission('assign', 'project'), projectController.removeIndividual);

// Project Manager & Maintainers (Hierarchical)
router.post('/:workshopId/projects/:projectId/manager', authenticate, requirePermission('manage', 'project'), projectController.assignProjectManager);
router.post('/:workshopId/projects/:projectId/maintainers', authenticate, requirePermission('manage', 'project'), projectController.addMaintainer);
router.delete('/:workshopId/projects/:projectId/maintainers/:maintainerId', authenticate, requirePermission('manage', 'project'), projectController.removeMaintainer);

// ============================================
// TASK ROUTES
// ============================================

router.get('/:workshopId/projects/:projectId/tasks', authenticate, requireWorkshopMembership, taskController.getProjectTasks);
router.get('/:workshopId/projects/:projectId/tasks/board', authenticate, requireWorkshopMembership, taskController.getProjectTaskBoard);
router.post('/:workshopId/projects/:projectId/tasks', authenticate, requirePermission('create', 'task'), taskController.createTask);
router.get('/:workshopId/projects/:projectId/tasks/:taskId', authenticate, requireWorkshopMembership, taskController.getTask);
router.put('/:workshopId/projects/:projectId/tasks/:taskId', authenticate, requirePermission('update', 'task'), taskController.updateTask);
router.put('/:workshopId/projects/:projectId/tasks/:taskId/status', authenticate, requirePermission('update', 'task'), taskController.updateTaskStatus);
router.delete('/:workshopId/projects/:projectId/tasks/:taskId', authenticate, requirePermission('delete', 'task'), taskController.deleteTask);
router.get('/:workshopId/projects/:projectId/tasks/:taskId/activity', authenticate, requireWorkshopMembership, taskController.getTaskActivities);

// ============================================
// TASK ASSIGNMENT ROUTES
// ============================================

router.post('/:workshopId/projects/:projectId/tasks/:taskId/teams', authenticate, requirePermission('assign', 'task'), taskController.assignTeam);
router.post('/:workshopId/projects/:projectId/tasks/:taskId/individuals', authenticate, requirePermission('assign', 'task'), taskController.assignIndividual);

// ============================================
// USER TASK ROUTES
// ============================================

router.get('/:workshopId/my-tasks', authenticate, requireWorkshopMembership, taskController.getMyTasks);

export default router;