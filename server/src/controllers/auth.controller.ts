import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
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

  res.json({
    _id: profile.id,
    studentId: profile.student_id,
    name: { first: profile.first_name, last: profile.last_name },
    email: authUser.user?.email,
    role: profile.role,
    avatarUrl: profile.avatar_url,
    isActive: profile.is_active,
    createdAt: profile.created_at,
  });
}

export async function changePassword(req: Request, res: Response) {
  const { newPassword } = changePasswordSchema.parse(req.body);
  const { error } = await supabase.auth.admin.updateUserById(req.user!.userId, { password: newPassword });
  if (error) throw new AppError(400, error.message);
  res.json({ message: 'Password changed' });
}
