import { Router } from 'express';
import { authMiddleware, optionalAuthenticate, requireWorkshopMembership, requirePermission } from '@middlewares';
import { WORKSHOP_ROUTES, TEAM_ROUTES, PROJECT_ROUTES, TASK_ROUTES } from '@constants';
import { Container } from '@di/types';

export const createWorkshopRoutes = (container: Container) => {
    const router = Router();
    const workshopController = container.workshopCtrl;
    const projectController = container.workshopProjectCtrl;
    const taskController = container.workshopTaskCtrl;
    const teamController = container.teamCtrl;

    router.post(WORKSHOP_ROUTES.BASE, authMiddleware, workshopController.createWorkshop);
    router.get(WORKSHOP_ROUTES.MY_WORKSHOPS, authMiddleware, workshopController.getUserWorkshops);
    router.get(WORKSHOP_ROUTES.PUBLIC, optionalAuthenticate, workshopController.getPublicWorkshops);
    router.post(WORKSHOP_ROUTES.UPVOTE, authMiddleware, workshopController.upvoteWorkshop);
    router.post(WORKSHOP_ROUTES.DOWNVOTE, authMiddleware, workshopController.downvoteWorkshop);
    router.get(WORKSHOP_ROUTES.CHECK_PERMISSION, authMiddleware, workshopController.checkPermission);
    router.get(WORKSHOP_ROUTES.BY_ID, authMiddleware, requireWorkshopMembership, workshopController.getWorkshop);
    router.put(WORKSHOP_ROUTES.BY_ID, authMiddleware, requirePermission('update', 'workshop'), workshopController.updateWorkshop);
    router.delete(WORKSHOP_ROUTES.BY_ID, authMiddleware, requirePermission('delete', 'workshop'), workshopController.deleteWorkshop);

    router.get(WORKSHOP_ROUTES.MEMBERS, authMiddleware, requireWorkshopMembership, workshopController.getMembers);
    router.get(WORKSHOP_ROUTES.PENDING_REQUESTS, authMiddleware, requirePermission('manage', 'membership'), workshopController.getPendingRequests);
    router.post(WORKSHOP_ROUTES.INVITE, authMiddleware, requirePermission('invite', 'membership'), workshopController.inviteMember);
    router.post(WORKSHOP_ROUTES.JOIN, authMiddleware, workshopController.handleJoinRequest);
    router.post(WORKSHOP_ROUTES.APPROVE_REQUEST, authMiddleware, requirePermission('approve', 'membership'), workshopController.approveJoinRequest);
    router.post(WORKSHOP_ROUTES.REJECT_REQUEST, authMiddleware, requirePermission('reject', 'membership'), workshopController.rejectJoinRequest);
    router.delete(WORKSHOP_ROUTES.REVOKE_MEMBERSHIP, authMiddleware, requirePermission('revoke', 'membership'), workshopController.revokeMembership);
    router.post(WORKSHOP_ROUTES.LEAVE, authMiddleware, requireWorkshopMembership, workshopController.leaveWorkshop);

    router.post(WORKSHOP_ROUTES.ASSIGN_MANAGER, authMiddleware, requirePermission('assign_manager', 'workshop'), workshopController.assignManager);
    router.delete(WORKSHOP_ROUTES.REMOVE_MANAGER, authMiddleware, requirePermission('remove_manager', 'workshop'), workshopController.removeManager);

    router.get(TEAM_ROUTES.USER_TEAMS, authMiddleware, requireWorkshopMembership, teamController.getUserTeams); // Adjusted as it's /user/:userId
    router.get(WORKSHOP_ROUTES.BY_ID + TEAM_ROUTES.BASE, authMiddleware, requireWorkshopMembership, teamController.getWorkshopTeams);
    router.post(WORKSHOP_ROUTES.BY_ID + TEAM_ROUTES.BASE, authMiddleware, requirePermission('create', 'team'), teamController.createTeam);
    router.get(WORKSHOP_ROUTES.BY_ID + TEAM_ROUTES.BY_ID, authMiddleware, requireWorkshopMembership, teamController.getTeam);
    router.put(WORKSHOP_ROUTES.BY_ID + TEAM_ROUTES.BY_ID, authMiddleware, requirePermission('update', 'team'), teamController.updateTeam);
    router.delete(WORKSHOP_ROUTES.BY_ID + TEAM_ROUTES.BY_ID, authMiddleware, requirePermission('delete', 'team'), teamController.deleteTeam);
    router.post(WORKSHOP_ROUTES.BY_ID + TEAM_ROUTES.MEMBERS, authMiddleware, requirePermission('manage', 'team'), teamController.addMember);
    router.delete(WORKSHOP_ROUTES.BY_ID + TEAM_ROUTES.MEMBER_BY_ID, authMiddleware, requirePermission('manage', 'team'), teamController.removeMember);
    router.get(WORKSHOP_ROUTES.BY_ID + TEAM_ROUTES.BY_ID + '/tasks', authMiddleware, requireWorkshopMembership, taskController.getTeamTasks);

    router.get(WORKSHOP_ROUTES.BY_ID + PROJECT_ROUTES.BASE, authMiddleware, requireWorkshopMembership, projectController.getProjects);
    router.post(WORKSHOP_ROUTES.BY_ID + PROJECT_ROUTES.BASE, authMiddleware, requirePermission('create', 'project'), projectController.createProject);
    router.get(WORKSHOP_ROUTES.BY_ID + PROJECT_ROUTES.BY_ID, authMiddleware, requireWorkshopMembership, projectController.getProject);
    router.put(WORKSHOP_ROUTES.BY_ID + PROJECT_ROUTES.BY_ID, authMiddleware, requirePermission('update', 'project'), projectController.updateProject);
    router.delete(WORKSHOP_ROUTES.BY_ID + PROJECT_ROUTES.BY_ID, authMiddleware, requirePermission('delete', 'project'), projectController.deleteProject);

    router.post(WORKSHOP_ROUTES.BY_ID + PROJECT_ROUTES.TEAMS, authMiddleware, requirePermission('assign', 'project'), projectController.assignTeam);
    router.delete(WORKSHOP_ROUTES.BY_ID + PROJECT_ROUTES.TEAM_BY_ID, authMiddleware, requirePermission('assign', 'project'), projectController.removeTeam);
    router.post(WORKSHOP_ROUTES.BY_ID + PROJECT_ROUTES.INDIVIDUALS, authMiddleware, requirePermission('assign', 'project'), projectController.assignIndividual);
    router.delete(WORKSHOP_ROUTES.BY_ID + PROJECT_ROUTES.INDIVIDUAL_BY_ID, authMiddleware, requirePermission('assign', 'project'), projectController.removeIndividual);

    router.post(WORKSHOP_ROUTES.BY_ID + PROJECT_ROUTES.MANAGER, authMiddleware, requirePermission('manage', 'project'), projectController.assignProjectManager);
    router.post(WORKSHOP_ROUTES.BY_ID + PROJECT_ROUTES.MAINTAINERS, authMiddleware, requirePermission('manage', 'project'), projectController.addMaintainer);
    router.delete(WORKSHOP_ROUTES.BY_ID + PROJECT_ROUTES.MAINTAINER_BY_ID, authMiddleware, requirePermission('manage', 'project'), projectController.removeMaintainer);

    router.get(WORKSHOP_ROUTES.BY_ID + PROJECT_ROUTES.BY_ID + TASK_ROUTES.BASE, authMiddleware, requireWorkshopMembership, taskController.getProjectTasks);
    router.get(WORKSHOP_ROUTES.BY_ID + PROJECT_ROUTES.BY_ID + TASK_ROUTES.BOARD, authMiddleware, requireWorkshopMembership, taskController.getProjectTaskBoard);
    router.post(WORKSHOP_ROUTES.BY_ID + PROJECT_ROUTES.BY_ID + TASK_ROUTES.BASE, authMiddleware, requirePermission('create', 'task'), taskController.createTask);
    router.get(WORKSHOP_ROUTES.BY_ID + PROJECT_ROUTES.BY_ID + TASK_ROUTES.BY_ID, authMiddleware, requireWorkshopMembership, taskController.getTask);
    router.put(WORKSHOP_ROUTES.BY_ID + PROJECT_ROUTES.BY_ID + TASK_ROUTES.BY_ID, authMiddleware, requirePermission('update', 'task'), taskController.updateTask);
    router.put(WORKSHOP_ROUTES.BY_ID + PROJECT_ROUTES.BY_ID + TASK_ROUTES.STATUS, authMiddleware, requirePermission('update', 'task'), taskController.updateTaskStatus);
    router.delete(WORKSHOP_ROUTES.BY_ID + PROJECT_ROUTES.BY_ID + TASK_ROUTES.BY_ID, authMiddleware, requirePermission('delete', 'task'), taskController.deleteTask);
    router.get(WORKSHOP_ROUTES.BY_ID + PROJECT_ROUTES.BY_ID + TASK_ROUTES.ACTIVITY, authMiddleware, requireWorkshopMembership, taskController.getTaskActivities);

    router.post(WORKSHOP_ROUTES.BY_ID + PROJECT_ROUTES.BY_ID + TASK_ROUTES.TEAMS, authMiddleware, requirePermission('assign', 'task'), taskController.assignTeam);
    router.post(WORKSHOP_ROUTES.BY_ID + PROJECT_ROUTES.BY_ID + TASK_ROUTES.INDIVIDUALS, authMiddleware, requirePermission('assign', 'task'), taskController.assignIndividual);

    router.get(WORKSHOP_ROUTES.BY_ID + TASK_ROUTES.MY_TASKS, authMiddleware, requireWorkshopMembership, taskController.getMyTasks);

    return router;
};

export default createWorkshopRoutes;