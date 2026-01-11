import dotenv from 'dotenv';
dotenv.config();

import express, { Application } from 'express';
import cors from 'cors';
import morgan from "morgan";
import { errorHandler } from './middlewares/errorMiddleware';

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
import passport from 'passport';

const app: Application = express();

app.use(passport.initialize());

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

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

// Chat and Activity routes
app.use('/api/chat', chatRoutes);
app.use('/api', activityRoutes);

app.use(errorHandler);

export default app;