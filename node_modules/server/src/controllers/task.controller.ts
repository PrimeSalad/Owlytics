import { Request, Response } from 'express';
import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';

export async function getMyTasks(req: Request, res: Response) {
  const userId = req.user!.userId;

  const toRow = (t: any) => ({
    _id: t.id, title: t.title, description: t.description,
    status: t.status, sprint_id: t.sprint_id,
    sprint: t.sprint ? { _id: t.sprint.id, name: t.sprint.name, status: t.sprint.status } : null,
    visible_to: t.visible_to || [], assignees: t.assignees || [],
    comments: t.comments || [], createdAt: t.created_at,
  });

  // Try jsonb @> containment first
  const { data, error } = await supabase
    .from('tasks')
    .select('*, sprint:sprints(id,name,status)')
    .contains('assignees', JSON.stringify([userId]))
    .order('created_at', { ascending: false });

  if (!error) return res.json((data ?? []).map(toRow));

  // Fallback for text[] storage: use cs with curly-brace syntax
  const { data: data2, error: error2 } = await supabase
    .from('tasks')
    .select('*, sprint:sprints(id,name,status)')
    .filter('assignees', 'cs', `{"${userId}"}`)
    .order('created_at', { ascending: false });

  if (error2) throw new AppError(500, error2.message);
  res.json((data2 ?? []).map(toRow));
}

export async function listTasks(req: Request, res: Response) {
  const { sprint_id } = req.query;
  if (!sprint_id) throw new AppError(400, 'sprint_id is required');

  const { data, error } = await supabase
    .from('tasks')
    .select('*, created_by:profiles(id,first_name,last_name,role)')
    .eq('sprint_id', sprint_id as string)
    .order('created_at', { ascending: false });
  if (error) throw new AppError(500, error.message);

  const userId = req.user!.userId;
  const userRole = req.user!.role;
  const canSeeAll = userRole === 'President' || userRole === 'Secretary';

  // Collect all unique assignee IDs across tasks
  const allAssigneeIds: string[] = [...new Set(
    (data ?? []).flatMap((t: any) => Array.isArray(t.assignees) ? t.assignees : [])
  )];

  // Fetch profiles for all assignees in one query
  const profileMap: Record<string, any> = {};
  if (allAssigneeIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id,first_name,last_name,role')
      .in('id', allAssigneeIds);
    (profiles ?? []).forEach((p: any) => { profileMap[p.id] = p; });
  }

  const tasks = (data ?? [])
    .filter((t: any) => {
      const assigneeIds: string[] = Array.isArray(t.assignees) ? t.assignees : [];
      const isAssigned = assigneeIds.includes(userId);
      const canSeeByRole = canSeeAll || (t.visible_to && t.visible_to.includes(userRole));
      return canSeeByRole || isAssigned;
    })
    .map((t: any) => {
      const assigneeIds: string[] = Array.isArray(t.assignees) ? t.assignees : [];
      return {
        _id: t.id, title: t.title, description: t.description,
        status: t.status, sprint_id: t.sprint_id,
        assignees: assigneeIds.map((id) => profileMap[id]
          ? { _id: id, name: { first: profileMap[id].first_name, last: profileMap[id].last_name }, role: profileMap[id].role }
          : { _id: id, name: { first: '?', last: '' }, role: '' }
        ),
        visible_to: t.visible_to || [],
        createdBy: t.created_by ? { _id: t.created_by.id, name: { first: t.created_by.first_name, last: t.created_by.last_name }, role: t.created_by.role } : null,
        comments: t.comments || [], attachments: t.attachments || [],
        viewingNow: t.viewing_now || [], createdAt: t.created_at, updatedAt: t.updated_at,
      };
    });

  res.json(tasks);
}

export async function createTask(req: Request, res: Response) {
  const { title, description, assignees, visible_to, sprint_id } = req.body;
  if (!sprint_id) throw new AppError(400, 'sprint_id is required');

  const role = req.user!.role;
  const allRoles = ['President', 'Secretary', 'Officer', 'Committee', 'Attendance'];
  const LOCKED: Record<string, string[]> = {
    President: ['President'],
    Secretary: ['President', 'Secretary'],
    Officer:   ['President', 'Secretary', 'Officer'],
  };
  const locked = LOCKED[role] ?? ['President'];
  const requested: string[] = Array.isArray(visible_to) && visible_to.length ? visible_to : allRoles;
  const finalVisibility = [...new Set([...locked, ...requested.filter((r) => allRoles.includes(r))])];

  let finalAssignees: string[] = Array.isArray(assignees) ? assignees : [];
  if (role !== 'President' && finalAssignees.length > 0) {
    const allowedRoles = role === 'Secretary' ? ['Officer', 'Committee', 'Attendance'] : ['Committee', 'Attendance'];
    const { data: allowed } = await supabase
      .from('profiles').select('id').in('role', allowedRoles);
    const allowedIds = new Set((allowed ?? []).map((p: any) => p.id));
    finalAssignees = finalAssignees.filter((id) => allowedIds.has(id));
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title, description, status: 'Todo', sprint_id,
      assignees: finalAssignees,
      visible_to: finalVisibility,
      created_by: req.user!.userId,
      comments: [], attachments: [], viewing_now: [],
    })
    .select().single();
  if (error) throw new AppError(400, error.message);
  res.status(201).json({ _id: data.id, ...data });
}

export async function updateTask(req: Request, res: Response) {
  const { status, title, description, assignees } = req.body;
  const update: any = {};
  if (status) update.status = status;
  if (title) update.title = title;
  if (description !== undefined) update.description = description;
  if (assignees !== undefined) {
    if (req.user!.role !== 'President') {
      const allowedRoles = req.user!.role === 'Secretary' ? ['Officer', 'Committee', 'Attendance'] : ['Committee', 'Attendance'];
      const { data: allowed } = await supabase
        .from('profiles').select('id').in('role', allowedRoles);
      const allowedIds = new Set((allowed ?? []).map((p: any) => p.id));
      update.assignees = (assignees as string[]).filter((id) => allowedIds.has(id));
    } else {
      update.assignees = assignees;
    }
  }
  
  const { error } = await supabase.from('tasks').update(update).eq('id', req.params.id);
  if (error) throw new AppError(400, error.message);
  res.json({ message: 'Task updated' });
}

export async function addComment(req: Request, res: Response) {
  const { content, mentions, parentId } = req.body;
  const { data: task, error: fetchErr } = await supabase.from('tasks').select('comments').eq('id', req.params.id).single();
  if (fetchErr || !task) throw new AppError(404, 'Task not found');
  
  const newComment = {
    _id: Date.now().toString(),
    userId: { _id: req.user!.userId, role: req.user!.role },
    content,
    mentions: mentions || [],
    parentId: parentId || null,
    createdAt: new Date().toISOString(),
  };
  
  const comments = [...(task.comments || []), newComment];
  const { error } = await supabase.from('tasks').update({ comments }).eq('id', req.params.id);
  if (error) throw new AppError(400, error.message);
  res.status(201).json(newComment);
}

export async function deleteTask(req: Request, res: Response) {
  await supabase.from('tasks').delete().eq('id', req.params.id);
  res.json({ message: 'Task deleted' });
}
