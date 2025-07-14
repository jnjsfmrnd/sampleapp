import { Request } from 'express';

export interface AuthUser {
  id: number;
  username: string;
  isAdmin?: boolean;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}
