import { Server as HTTPServer } from 'http';
import { DIContainer } from './container';
import { Container } from './types';

export * from './types';
export * from './container';

export const createDIContainer = (httpServer: HTTPServer): Container => {
    return new DIContainer(httpServer);
};
