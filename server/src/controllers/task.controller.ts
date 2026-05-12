import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';

export async function listTasks(req: Request, res: Response) {
  const { sprint_id } = req.query;
  if (!sprint_id) throw new AppError(400, 'sprint_id is required');

  let query = supabase
    .from('tasks')
    .select('*, created_by:profiles(id,first_name,last_name,role)')
    .eq('sprint_id', sprint_id as string)
    .order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw new AppError(500, error.message);

  const userRole = req.user!.role;
  const canSeeAll = userRole === 'President' || userRole === 'Secretary';

  const tasks = (data ?? [])
    .filter((t: any) => canSeeAll || (t.visible_to && t.visible_to.includes(userRole)))
    .map((t: any) => ({
      _id: t.id, title: t.title, description: t.description,
      status: t.status, sprint_id: t.sprint_id,
      assignees: t.assignees || [], visible_to: t.visible_to || [],
      createdBy: t.created_by ? { _id: t.created_by.id, name: { first: t.created_by.first_name, last: t.created_by.last_name }, role: t.created_by.role } : null,
      comments: t.comments || [], attachments: t.attachments || [],
      viewingNow: t.viewing_now || [], createdAt: t.created_at, updatedAt: t.updated_at,
    }));

  res.json(tasks);
}

export async function createTask(req: Request, res: Response) {
  const { title, description, assignees, visible_to, sprint_id } = req.body;
  if (!sprint_id) throw new AppError(400, 'sprint_id is required');
  const allRoles = ['President', 'Secretary', 'Officer', 'Committee', 'Attendance'];
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title, description, status: 'Todo', sprint_id,
      assignees: assignees || [],
      visible_to: visible_to?.length ? visible_to : allRoles,
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
  if (assignees) update.assignees = assignees;
  
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
