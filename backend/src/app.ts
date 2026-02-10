import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import passport from 'passport';

import Database from './config/db.config';
import { Container } from "@di";
import { env } from './config/env';

import authRoutes from './routes/authRoutes';
import notificationRoutes from './routes/notificationRoutes';
import workshopRoutes from './routes/workshopRoutes';
import teamRoutes from './routes/teamRoutes';
import roleRoutes from './routes/roleRoutes';
import workshopProjectRoutes from './routes/workshopProjectRoutes';
import workshopTaskRoutes, { taskRouter, userTaskRouter, teamTaskRouter } from './routes/workshopTaskRoutes';
import auditRoutes from './routes/auditRoutes';
import permissionRoutes from './routes/permissionRoutes';
import chatRoutes from './routes/chatRoutes';
import activityRoutes from './routes/activityRoutes';
import inviteRoutes from './routes/inviteRoutes';

import { errorHandler } from './middlewares/errorMiddleware';
import { configurePassport } from './config/passport';

export const createApp = () => {
  const app = express();

  Database.getInstance();

  app.use(helmet());
  app.use(cookieParser());
  app.use(cors({
    origin: env.FRONTEND_URL,
    credentials: true
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('dev'));

  app.use(passport.initialize());
  configurePassport();

  app.use('/api/auth', authRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/workshops', workshopRoutes);
  app.use('/api/workshops/:workshopId/teams', teamRoutes);
  app.use('/api/workshops/:workshopId/roles', roleRoutes);
  app.use('/api/workshops/:workshopId/projects', workshopProjectRoutes);
  app.use('/api/workshops/:workshopId/projects/:projectId/tasks', workshopTaskRoutes);
  app.use('/api/workshops/:workshopId/audit', auditRoutes);
  app.use('/api/workshops/:workshopId/permissions', permissionRoutes);
  app.use('/api/workshop-tasks', taskRouter);
  app.use('/api/users', userTaskRouter);
  app.use('/api/teams', teamTaskRouter);
  app.use('/api/chat', chatRoutes);
  app.use('/api/invites', inviteRoutes);
  app.use('/api', activityRoutes);

  app.use(errorHandler);

  return app;
}