import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import type { UserRole } from './requireAuth';

/**
 * Role aliases — a role on the left inherits ALL permissions of the role on
 * the right. Adviser is treated exactly like President; VicePresident exactly
 * like Secretary. Keep this in sync with the client (`client/src/lib/utils.ts`).
 */
const ROLE_ALIASES: Partial<Record<UserRole, UserRole>> = {
  Adviser: 'President',
  VicePresident: 'Secretary',
};

/** Collapse an aliased role to its effective permission role. */
export function resolveRole(userRole: UserRole): UserRole {
  return ROLE_ALIASES[userRole] ?? userRole;
}

/** True if `userRole` (or the role it inherits from) is in `allowed`. */
export function roleSatisfies(userRole: UserRole, allowed: UserRole[]): boolean {
  if (allowed.includes(userRole)) return true;
  const alias = ROLE_ALIASES[userRole];
  return alias ? allowed.includes(alias) : false;
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roleSatisfies(req.user.role, roles)) {
      throw new AppError(403, 'Insufficient permissions');
    }
    next();
  };
}
