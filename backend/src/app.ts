import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import passport from 'passport';

import Database from './config/db.config';
import { Container } from '@di/types';
import { env } from './config/env';

import createAuthRoutes from './modules/auth/routes/authRoutes';
import createNotificationRoutes from './modules/notification/routes/notificationRoutes';
import createWorkshopRoutes from './modules/workshop/routes/workshopRoutes';
import createTeamRoutes from './modules/team/routes/teamRoutes';
import createRoleRoutes from './modules/access-control/routes/roleRoutes';
import createWorkshopProjectRoutes from './modules/project/routes/workshopProjectRoutes';
import createWorkshopTaskRoutes, {
  createTaskRouter,
  createUserTaskRouter,
  createTeamTaskRouter
} from './modules/task/routes/workshopTaskRoutes';
import createAuditRoutes from './modules/audit/routes/auditRoutes';
import createPermissionRoutes from './modules/access-control/routes/permissionRoutes';
import createChatRoutes from './modules/chat/routes/chatRoutes';
import createActivityRoutes from './modules/audit/routes/activityRoutes';
import createInviteRoutes from './modules/invitation/routes/inviteRoutes';
import { setupAutomationRoutes } from './modules/automation/routes';


import { errorHandler, injectContainer } from '@middlewares';
import { configurePassport } from './config/passport';
import { API_PREFIX, MODULE_BASE } from '@constants';

export const createApp = (container: Container) => {
  const app = express();

  Database.getInstance();

  app.use(helmet());
  app.use(injectContainer(container));
  app.use(cookieParser());
  app.use(cors({
    origin: env.FRONTEND_URL,
    credentials: true
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('dev'));

  app.use(passport.initialize());
  configurePassport(container);

  app.use(`${API_PREFIX}${MODULE_BASE.AUTH}`, createAuthRoutes(container));
  app.use(`${API_PREFIX}${MODULE_BASE.NOTIFICATIONS}`, createNotificationRoutes(container));
  app.use(`${API_PREFIX}${MODULE_BASE.WORKSHOPS}`, createWorkshopRoutes(container));
  app.use(`${API_PREFIX}${MODULE_BASE.TEAMS}`, createTeamRoutes(container));
  app.use(`${API_PREFIX}${MODULE_BASE.ROLES}`, createRoleRoutes(container));
  app.use(`${API_PREFIX}${MODULE_BASE.PROJECTS}`, createWorkshopProjectRoutes(container));
  app.use(`${API_PREFIX}${MODULE_BASE.PROJECT_TASKS}`, createWorkshopTaskRoutes(container));
  app.use(`${API_PREFIX}${MODULE_BASE.AUDIT}`, createAuditRoutes(container));
  app.use(`${API_PREFIX}${MODULE_BASE.PERMISSION_CHECK}`, createPermissionRoutes(container));

  app.use(`${API_PREFIX}${MODULE_BASE.TASKS}`, createTaskRouter(container));
  app.use(`${API_PREFIX}${MODULE_BASE.USER_TASKS}`, createUserTaskRouter(container));
  app.use(`${API_PREFIX}${MODULE_BASE.TEAM_TASKS}`, createTeamTaskRouter(container));

  app.use(`${API_PREFIX}${MODULE_BASE.CHAT}`, createChatRoutes(container));
  app.use(`${API_PREFIX}${MODULE_BASE.INVITES}`, createInviteRoutes(container));
  app.use(`${API_PREFIX}${MODULE_BASE.ACTIVITY}`, createActivityRoutes(container));
  app.use(`${API_PREFIX}${MODULE_BASE.AUTOMATION}`, setupAutomationRoutes(container.automationCtrl));


  app.use(errorHandler);

  return app;
}
