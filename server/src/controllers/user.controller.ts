import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';
import { createUserSchema, updateUserSchema } from '../validators/user.validator';

export async function listUsers(_req: Request, res: Response) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, student_id, first_name, last_name, role, avatar_url, is_active, last_login, created_at')
    .order('created_at', { ascending: false });

  if (error) throw new AppError(500, error.message);

  // Get emails from auth
  const { data: authList } = await supabase.auth.admin.listUsers();
  const emailMap = Object.fromEntries(authList.users.map((u) => [u.id, u.email]));

  res.json(data.map((p) => ({
    _id: p.id,
    studentId: p.student_id,
    name: { first: p.first_name, last: p.last_name },
    email: emailMap[p.id] ?? '',
    role: p.role,
    avatarUrl: p.avatar_url,
    isActive: p.is_active,
    lastLogin: p.last_login,
    createdAt: p.created_at,
  })));
}

export async function createUser(req: Request, res: Response) {
  const data = createUserSchema.parse(req.body);

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      student_id: data.studentId,
      first_name: data.name.first,
      last_name: data.name.last,
      role: data.role,
    },
  });

  if (authError) throw new AppError(400, authError.message);

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: authData.user.id,
    student_id: data.studentId,
    first_name: data.name.first,
    last_name: data.name.last,
    role: data.role,
    is_active: true,
  });

  if (profileError) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw new AppError(400, profileError.message);
  }

  res.status(201).json({ _id: authData.user.id, email: data.email, role: data.role });
}

export async function updateUser(req: Request, res: Response) {
  const data = updateUserSchema.parse(req.body);
  const { error } = await supabase.from('profiles').update({
    ...(data.role && { role: data.role }),
    ...(data.isActive !== undefined && { is_active: data.isActive }),
  }).eq('id', req.params.id);

  if (error) throw new AppError(500, error.message);
  res.json({ message: 'Updated' });
}

export async function deactivateUser(req: Request, res: Response) {
  const { error } = await supabase.from('profiles').update({ is_active: false }).eq('id', req.params.id);
  if (error) throw new AppError(500, error.message);
  res.json({ message: 'User deactivated' });
}
