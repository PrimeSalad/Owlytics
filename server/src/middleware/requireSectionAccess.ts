import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from './errorHandler';

/**
 * Middleware to verify attendance staff can only access their assigned section
 * Checks that:
 * - User has an assigned section (if role is Attendance)
 * - Section ID in query/params matches their assigned section
 * - Admin users can override this restriction
 */
export async function requireSectionAccess(req: Request, res: Response, next: NextFunction) {
  const user = req.user;
  if (!user) throw new AppError(401, 'Not authenticated');

  // Get user profile with section info
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, section_id')
    .eq('id', user.userId)
    .single();

  if (profileError) throw new AppError(500, profileError.message);
  if (!profile) throw new AppError(404, 'User profile not found');

  // Admin roles can access all sections
  if (['President', 'Secretary', 'Officer'].includes(profile.role)) {
    return next();
  }

  // Attendance role must have section assigned
  if (profile.role === 'Attendance') {
    if (!profile.section_id) {
      throw new AppError(403, 'No section assigned to your account');
    }

    // Check if requested section matches assigned section
    const requestedSectionId = req.query.section_id || req.params.sectionId || req.body?.sectionId;

    if (requestedSectionId && requestedSectionId !== profile.section_id) {
      throw new AppError(403, 'Unauthorized: You can only access your assigned section');
    }

    // Store assigned section in request for use in controllers
    req.assignedSectionId = profile.section_id;
  }

  next();
}

/**
 * Middleware to automatically filter results by assigned section for Attendance staff
 * Useful for queries that don't explicitly pass section_id but should be filtered
 */
export async function filterByAssignedSection(req: Request, res: Response, next: NextFunction) {
  const user = req.user;
  if (!user) throw new AppError(401, 'Not authenticated');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, section_id')
    .eq('id', user.userId)
    .single();

  if (profileError) throw new AppError(500, profileError.message);

  // Only filter for Attendance role
  if (profile?.role === 'Attendance' && profile?.section_id) {
    req.assignedSectionId = profile.section_id;
  }

  next();
}

// Extend Express Request type to include assignedSectionId
declare global {
  namespace Express {
    interface Request {
      assignedSectionId?: string;
    }
  }
}
