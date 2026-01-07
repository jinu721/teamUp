import dotenv from 'dotenv';
// Load environment variables FIRST before any other imports
// Forced restart to pick up schema changes
dotenv.config();

import express, { Application } from 'express';
import http from 'http';
import cors from 'cors';
import { connectDatabase } from './config/database';
import { SocketService } from './services/SocketService';
import { errorHandler } from './middlewares/errorMiddleware';

import authRoutes from './routes/authRoutes';
import notificationRoutes, { notificationService } from './routes/notificationRoutes';

// Workshop domain routes
import workshopRoutes, { workshopController, teamController, projectController, taskController } from './routes/workshopRoutes';
import roleRoutes, { roleController } from './routes/roleRoutes';
import workshopProjectRoutes from './routes/workshopProjectRoutes';
import workshopTaskRoutes, { taskRouter, userTaskRouter, teamTaskRouter } from './routes/workshopTaskRoutes';
import auditRoutes from './routes/auditRoutes';
import permissionRoutes from './routes/permissionRoutes';
import chatRoutes, { chatController } from './routes/chatRoutes';
import activityRoutes from './routes/activityRoutes';
import morgan from 'morgan';

const app: Application = express();
const server = http.createServer(app);

const PORT = 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

const socketService = new SocketService(server);

// Set socket service for services
notificationService.setSocketService(socketService);
workshopController.setSocketService(socketService);
roleController.setSocketService(socketService);
teamController.setSocketService(socketService);
projectController.setSocketService(socketService);
taskController.setSocketService(socketService);
chatController.setSocketService(socketService);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);

// Workshop-aware routes (new architecture)
app.use('/api/workshops', workshopRoutes);
app.use('/api/workshops/:workshopId/roles', roleRoutes);
app.use('/api/workshops/:workshopId/projects', workshopProjectRoutes);
app.use('/api/workshops/:workshopId/projects/:projectId/tasks', workshopTaskRoutes);
app.use('/api/workshops/:workshopId/audit', auditRoutes);
app.use('/api/workshops/:workshopId/permissions', permissionRoutes);

// Shared task routes
app.use('/api/workshop-tasks', taskRouter);
app.use('/api/users', userTaskRouter);
app.use('/api/teams', teamTaskRouter);

// Chat and Activity routes
app.use('/api/chat', chatRoutes);
app.use('/api', activityRoutes);

app.use(errorHandler);

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();

    server.listen(PORT, () => {
      console.log(`Server Started on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
