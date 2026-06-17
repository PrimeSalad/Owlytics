import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';
import { createUserSchema, updateUserSchema } from '../validators/user.validator';
import { logAction } from '../utils/auditLogger';

export async function listUsers(_req: Request, res: Response) {
  let query = supabase
    .from('profiles')
    .select(`
      id,
      student_id,
      first_name,
      last_name,
      role,
      avatar_url,
      avatar_color,
      section_id,
      is_active,
      last_login,
      created_at,
      sections (
        id,
        course_id,
        academic_year,
        block,
        courses (
          course_code,
          course_name
        )
      )
    `)
    .order('created_at', { ascending: false });

  let { data, error } = await query;

  // Fallback if relationship is missing
  if (error && (error.code === 'PGRST200' || error.code === 'PGRST205')) {
    const fallbackRes = await supabase
      .from('profiles')
      .select(`
        id,
        student_id,
        first_name,
        last_name,
        role,
        avatar_url,
        avatar_color,
        section_id,
        is_active,
        last_login,
        created_at
      `)
      .order('created_at', { ascending: false });
    data = fallbackRes.data as typeof data;
    error = fallbackRes.error;
  }

  if (error) throw new AppError(500, error.message);

  // Get emails from auth — admin.listUsers is paginated (max 1000 per page)
  const { data: authList, error: authListError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const emailMap: Record<string, string> = authListError || !authList
    ? {}
    : Object.fromEntries(authList.users.map((u) => [u.id, u.email ?? '']));

  res.json((data ?? []).map((p: any) => {
    let assignedSection = null;
    if (p.section_id && p.sections) {
      const section = p.sections;
      assignedSection = `${section.courses.course_code} ${section.academic_year}-${section.block}`;
    }
    
    return {
      _id: p.id,
      studentId: p.student_id,
      name: { first: p.first_name, last: p.last_name },
      email: emailMap[p.id] ?? '',
      role: p.role,
      avatarUrl: p.avatar_url,
      avatarColor: p.avatar_color ?? 0,
      sectionId: p.section_id,
      assignedSection,
      isActive: p.is_active,
      lastLogin: p.last_login,
      createdAt: p.created_at,
    };
  }));
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

  // Validate section_id if provided (required for Attendance role)
  if (data.sectionId) {
    const { data: section, error: sectionError } = await supabase
      .from('sections')
      .select('id, is_active')
      .eq('id', data.sectionId)
      .maybeSingle();

    if (sectionError) throw new AppError(500, sectionError.message);
    if (!section) throw new AppError(404, 'Selected section not found');
    if (!section.is_active) throw new AppError(400, 'Selected section is inactive');
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

  // Prepare profile data
  const profileData: any = {
    id: authData.user.id,
    student_id: data.studentId,
    first_name: data.name.first,
    last_name: data.name.last,
    role: data.role,
    is_active: true,
  };

  // Add section_id if provided (required for Attendance role)
  if (data.sectionId) {
    profileData.section_id = data.sectionId;
  }

  const { error: profileError } = await supabase.from('profiles').upsert(profileData, { onConflict: 'id' });

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

  await logAction(req.user!.userId, 'CREATE', 'USER', `Created new user ${data.name.first} ${data.name.last} (${data.role})`, authData.user.id);

  res.status(201).json({ _id: authData.user.id, email: data.email, role: data.role });
}

export async function updateUser(req: Request, res: Response) {
  const data = updateUserSchema.parse(req.body);
  const userId = req.params.id;
  
  // Security check: Only President can update others or change roles/status
  const isSelfUpdate = req.user!.userId === userId;
  const isPresident = req.user!.role === 'President';
  
  if (!isSelfUpdate && !isPresident) {
    throw new AppError(403, 'Insufficient permissions to update this user');
  }

  const updatePayload: Record<string, unknown> = {};
  
  // Only President can update role, isActive, and sectionId
  if (isPresident) {
    if (data.role) updatePayload.role = data.role;
    if (data.isActive !== undefined) updatePayload.is_active = data.isActive;
    
    // Validate section_id if provided
    if (data.sectionId) {
      const { data: section, error: sectionError } = await supabase
        .from('sections')
        .select('id, is_active')
        .eq('id', data.sectionId)
        .maybeSingle();

      if (sectionError) throw new AppError(500, sectionError.message);
      if (!section) throw new AppError(404, 'Selected section not found');
      if (!section.is_active) throw new AppError(400, 'Selected section is inactive');
      
      updatePayload.section_id = data.sectionId;
    } else if (data.sectionId === null) {
      // Explicitly allow clearing section_id
      updatePayload.section_id = null;
    }
  } else {
    if (data.role || data.isActive !== undefined || data.sectionId) {
      throw new AppError(403, 'You do not have permission to change roles, active status, or sections');
    }
  }

  // Profile data (can be updated by self or President)
  if (data.name) {
    updatePayload.first_name = data.name.first;
    updatePayload.last_name = data.name.last;
    
    // Also update auth user metadata if name changes
    await supabase.auth.admin.updateUserById(userId as string, {
      user_metadata: { first_name: data.name.first, last_name: data.name.last }
    });
  }

  if (data.avatarImage !== undefined) {
    updatePayload.avatar_url = data.avatarImage;
  } else if (data.avatarUrl !== undefined) {
    updatePayload.avatar_url = data.avatarUrl;
  }

  if (data.avatarColor !== undefined) {
    updatePayload.avatar_color = data.avatarColor;
  }

  // Need something to update
  if (Object.keys(updatePayload).length === 0) {
    return res.json({ message: 'Nothing to update' });
  }

  const { error } = await supabase.from('profiles').update(updatePayload).eq('id', userId);

  if (error) throw new AppError(500, error.message);
  
  await logAction(req.user!.userId, 'UPDATE', 'USER', `Updated user ID ${userId} profile`, userId as string);

  res.json({ message: 'User updated successfully' });
}

export async function deactivateUser(req: Request, res: Response) {
  const id = req.params.id as string;
  const adminId = req.user!.userId;
  
  // Clean up database references to prevent foreign key constraint violations
  // 1. Reassign NOT NULL references to the admin performing the deletion
  await supabase.from('reports').update({ author_id: adminId }).eq('author_id', id);
  await supabase.from('accomplishment_exports').update({ exported_by: adminId }).eq('exported_by', id);
  
  // 2. Nullify optional references
  await supabase.from('attendance_records').update({ scanned_by: null }).eq('scanned_by', id);
  await supabase.from('reports').update({ approved_by: null }).eq('approved_by', id);
  await supabase.from('reports').update({ submitted_by: null }).eq('submitted_by', id);
  await supabase.from('reports').update({ created_by: null }).eq('created_by', id);
  await supabase.from('reports').update({ resolved_by: null }).eq('resolved_by', id);
  await supabase.from('events').update({ created_by: null }).eq('created_by', id);
  await supabase.from('activities').update({ committee_id: null }).eq('committee_id', id);

  // 3. Delete auth account
  await supabase.auth.admin.deleteUser(id);
  
  // 4. Delete the profile
  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (error) {
    // If it still fails, it means there is another constraint we missed. 
    // Throwing an informative error is better than a cryptic DB error.
    console.error('[deactivateUser] Delete error:', error.message);
    throw new AppError(500, `Could not delete profile due to database constraints: ${error.message}`);
  }
  
  await logAction(adminId, 'DELETE', 'USER', `Deleted user account ID ${id} and reassigned their records`, id);

  res.json({ message: 'Account deleted' });
}
