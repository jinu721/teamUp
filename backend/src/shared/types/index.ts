
import { Request } from 'express';
import { Container as DIContainer } from '../../di/types';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
    }
  }
}

export type AuthRequest = Request & {
  container?: DIContainer;
};

export interface Pagination {
  page: number;
  limit: number;
}
