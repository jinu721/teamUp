import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { Container } from '../di/types';

export const injectContainer = (container: Container) => {
    return (req: AuthRequest, _res: Response, next: NextFunction) => {
        req.container = container;
        next();
    };
};
