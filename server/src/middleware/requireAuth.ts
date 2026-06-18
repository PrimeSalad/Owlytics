import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from './errorHandler';

export type UserRole =
  | 'President'
  | 'Secretary'
  | 'Officer'
  | 'Committee'
  | 'Attendance'
  | 'VicePresident'
  | 'Adviser';

export interface AuthPayload {
  userId: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) throw new AppError(401, 'Not authenticated');

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new AppError(401, 'Invalid or expired token');

  // Get role from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single();

  if (!profile?.is_active) throw new AppError(401, 'Account is deactivated');

  req.user = { userId: user.id, role: profile.role as UserRole };
  next();
}
