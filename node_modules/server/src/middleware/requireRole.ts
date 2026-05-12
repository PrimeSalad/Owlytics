import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import type { UserRole } from './requireAuth';

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError(403, 'Insufficient permissions');
    }
    next();
  };
}
