import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import passport from 'passport';

import Database from './config/db.config';
import { Container } from './di/types';
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

import { errorHandler } from './shared/middlewares/errorMiddleware';
import { configurePassport } from './config/passport';
import { injectContainer } from './shared/middlewares/di';

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

  app.use('/api/auth', createAuthRoutes(container));
  app.use('/api/notifications', createNotificationRoutes(container));
  app.use('/api/workshops', createWorkshopRoutes(container));
  app.use('/api/workshops/:workshopId/teams', createTeamRoutes(container));
  app.use('/api/workshops/:workshopId/roles', createRoleRoutes(container));
  app.use('/api/workshops/:workshopId/projects', createWorkshopProjectRoutes(container));
  app.use('/api/workshops/:workshopId/projects/:projectId/tasks', createWorkshopTaskRoutes(container));
  app.use('/api/workshops/:workshopId/audit', createAuditRoutes(container));
  app.use('/api/workshops/:workshopId/permissions', createPermissionRoutes(container));

  app.use('/api/workshop-tasks', createTaskRouter(container));
  app.use('/api/users', createUserTaskRouter(container));
  app.use('/api/teams', createTeamTaskRouter(container));

  app.use('/api/chat', createChatRoutes(container));
  app.use('/api/invites', createInviteRoutes(container));
  app.use('/api', createActivityRoutes(container));

  app.use(errorHandler);

  return app;
}