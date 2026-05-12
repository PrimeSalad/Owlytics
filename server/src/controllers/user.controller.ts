import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';
import { createUserSchema, updateUserSchema } from '../validators/user.validator';

export async function listUsers(_req: Request, res: Response) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, student_id, first_name, last_name, role, avatar_url, assigned_section, is_active, last_login, created_at')
    .order('created_at', { ascending: false });

  if (error) throw new AppError(500, error.message);

  // Get emails from auth — admin.listUsers is paginated (max 1000 per page)
  const { data: authList, error: authListError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const emailMap: Record<string, string> = authListError || !authList
    ? {}
    : Object.fromEntries(authList.users.map((u) => [u.id, u.email ?? '']));

  res.json(data.map((p) => ({
    _id: p.id,
    studentId: p.student_id,
    name: { first: p.first_name, last: p.last_name },
    email: emailMap[p.id] ?? '',
    role: p.role,
    avatarUrl: p.avatar_url,
    assignedSection: p.assigned_section,
    isActive: p.is_active,
    lastLogin: p.last_login,
    createdAt: p.created_at,
  })));
}

export async function createUser(req: Request, res: Response) {
  const data = createUserSchema.parse(req.body);

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('student_id', data.studentId)
    .maybeSingle();

  if (existingProfileError) throw new AppError(500, existingProfileError.message);
  if (existingProfile) {
    throw new AppError(409, 'Access ID is already used by another account');
  }

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

  if (authError) {
    throw new AppError(
      400,
      authError.message === 'Database error creating new user'
        ? 'Supabase could not create the profile. Run the updated auth trigger SQL in supabase_schema.sql, then try again.'
        : authError.message
    );
  }

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: authData.user.id,
    student_id: data.studentId,
    first_name: data.name.first,
    last_name: data.name.last,
    role: data.role,
    is_active: true,
  }, { onConflict: 'id' });

  if (profileError) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw new AppError(400, profileError.message);
  }

  // Verify profile exists after upsert (auth trigger may have raced)
  const { data: verifyProfile, error: verifyError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', authData.user.id)
    .single();

  if (verifyError || !verifyProfile) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw new AppError(500, 'Profile was not created. Check your Supabase auth trigger.');
  }

  res.status(201).json({ _id: authData.user.id, email: data.email, role: data.role });
}

export async function updateUser(req: Request, res: Response) {
  const data = updateUserSchema.parse(req.body);
  const userId = req.params.id;
  
  const updatePayload: Record<string, unknown> = {};
  if (data.role) updatePayload.role = data.role;
  if (data.isActive !== undefined) updatePayload.is_active = data.isActive;
  if (data.assignedSection !== undefined) updatePayload.assigned_section = data.assignedSection;
  
  const { error } = await supabase.from('profiles').update(updatePayload).eq('id', userId);

  if (error) throw new AppError(500, error.message);
  res.json({ message: 'User updated successfully' });
}

export async function deactivateUser(req: Request, res: Response) {
  const { error } = await supabase.from('profiles').update({ is_active: false }).eq('id', req.params.id);
  if (error) throw new AppError(500, error.message);
  res.json({ message: 'User deactivated' });
}
