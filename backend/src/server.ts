import express, { Application } from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { SocketService } from './services/SocketService';
import { errorHandler } from './middlewares/errorMiddleware';

import authRoutes from './routes/authRoutes';
import projectRoutes, { projectService } from './routes/projectRoutes';
import taskRoutes, { taskService } from './routes/taskRoutes';
import messageRoutes, { messageService } from './routes/messageRoutes';
import notificationRoutes from './routes/notificationRoutes';
import communityRoutes, { communityService } from './routes/communityRoutes';

dotenv.config();

const app: Application = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const socketService = new SocketService(server);

projectService.setSocketService(socketService);
taskService.setSocketService(socketService);
messageService.setSocketService(socketService);
communityService.setSocketService(socketService);

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', taskRoutes);
app.use('/api', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/community', communityRoutes);

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
