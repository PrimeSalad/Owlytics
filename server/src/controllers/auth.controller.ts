import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { loginSchema, changePasswordSchema } from '../validators/auth.validator';
import { logAction } from '../utils/auditLogger';

export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new AppError(401, 'Invalid credentials');

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (!profile?.is_active) throw new AppError(401, 'Account is deactivated');

  // Update last_login
  await supabase.from('profiles').update({ last_login: new Date().toISOString() }).eq('id', data.user.id);

  // Log successful login
  await logAction(profile.id, 'AUTH', 'USER', `User logged in`, profile.id);

  res.json({
    access_token: data.session!.access_token,
    user: {
      _id: profile.id,
      studentId: profile.student_id,
      name: { first: profile.first_name, last: profile.last_name },
      email: data.user.email,
      role: profile.role,
      avatarUrl: profile.avatar_url,
      isActive: profile.is_active,
    },
  });
}

export async function logout(_req: Request, res: Response) {
  res.json({ message: 'Logged out' });
}

export async function getMe(req: Request, res: Response) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', req.user!.userId)
    .single();

  if (!profile) throw new AppError(404, 'User not found');

  const { data: authUser } = await supabase.auth.admin.getUserById(req.user!.userId);

  // Resolve the assigned section's display name (used by Attendance committee UI).
  // Resolve straight from sections + courses (same as the People list) so it works
  // even if the section_details view isn't applied or the section is marked inactive.
  let assignedSection: string | null = null;
  if (profile.section_id) {
    const { data: section } = await supabase
      .from('sections')
      .select('academic_year, block, courses(course_code)')
      .eq('id', profile.section_id)
      .single();
    if (section) {
      const courses = section.courses as { course_code?: string } | { course_code?: string }[] | null;
      const courseCode = Array.isArray(courses) ? courses[0]?.course_code : courses?.course_code;
      assignedSection = `${courseCode ?? ''} ${section.academic_year}-${section.block}`.trim();
    }
  }

  res.json({
    _id: profile.id,
    studentId: profile.student_id,
    name: { first: profile.first_name, last: profile.last_name },
    email: authUser.user?.email,
    role: profile.role,
    avatarUrl: profile.avatar_url,
    avatarColor: profile.avatar_color ?? 0,
    sectionId: profile.section_id ?? null,
    assignedSection,
    isActive: profile.is_active,
    createdAt: profile.created_at,
  });
}

export async function changePassword(req: Request, res: Response) {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

  // Find the account email to verify the current password.
  const { data: authUser } = await supabase.auth.admin.getUserById(req.user!.userId);
  const email = authUser.user?.email;
  if (!email) throw new AppError(400, 'Unable to verify your account');

  // Verify the current password using an anon client (does not touch the admin session).
  const anon = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: verifyError } = await anon.auth.signInWithPassword({ email, password: currentPassword });
  if (verifyError) throw new AppError(400, 'Your current password is incorrect');

  const { error } = await supabase.auth.admin.updateUserById(req.user!.userId, { password: newPassword });
  if (error) throw new AppError(400, error.message);

  await logAction(req.user!.userId, 'UPDATE', 'USER', 'Changed account password', req.user!.userId);
  res.json({ message: 'Password changed' });
}
