import { createContainer } from "@di";
import { createApp } from "./app";
import { createServer } from "http";
import { env } from "./config/env";
import { SocketService } from "./services/SocketService";

import { notificationService } from './routes/notificationRoutes';
import { workshopController, teamController, projectController, taskController } from './routes/workshopRoutes';
import { roleController } from './routes/roleRoutes';
import { chatController } from './routes/chatRoutes';

export const bootstrap = async () => {
    const container = createContainer();

    const app = createApp();

    const httpServer = createServer(app);

    const socketService = new SocketService(httpServer);
    container.register('socketService', socketService);

    notificationService.setSocketService(socketService);
    workshopController.setSocketService(socketService);
    roleController.setSocketService(socketService);
    teamController.setSocketService(socketService);
    projectController.setSocketService(socketService);
    taskController.setSocketService(socketService);
    chatController.setSocketService(socketService);

    httpServer.listen(env.PORT, () => {
        console.log(`Server started on port ${env.PORT}`);
        console.log(`Environment: ${env.NODE_ENV}`);
    });
};
