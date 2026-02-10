import { createDIContainer } from "./di";
import { createApp } from "./app";
import { createServer } from "http";
import { env } from "./config/env";

export const bootstrap = async () => {
    const httpServer = createServer();

    const container = createDIContainer(httpServer);

    const app = createApp(container);
    httpServer.on('request', app);

    httpServer.listen(env.PORT, () => {
        console.log(`Server started on port ${env.PORT}`);
        console.log(`Environment: ${env.NODE_ENV}`);
    });
};
