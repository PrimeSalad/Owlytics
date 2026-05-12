import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';

export async function listTasks(_req: Request, res: Response) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, created_by:users!tasks_created_by_fkey(id,first_name,last_name,role)')
    .order('created_at', { ascending: false });
  if (error) throw new AppError(500, error.message);
  
  const tasks = (data ?? []).map((t: any) => ({
    _id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    assignees: t.assignees || [],
    createdBy: t.created_by ? { _id: t.created_by.id, name: { first: t.created_by.first_name, last: t.created_by.last_name }, role: t.created_by.role } : null,
    comments: t.comments || [],
    attachments: t.attachments || [],
    viewingNow: t.viewing_now || [],
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }));
  
  res.json(tasks);
}

export async function createTask(req: Request, res: Response) {
  const { title, description, assignees } = req.body;
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title,
      description,
      status: 'Todo',
      assignees: assignees || [],
      created_by: req.user!.id,
      comments: [],
      attachments: [],
      viewing_now: [],
    })
    .select()
    .single();
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
    userId: { _id: req.user!.id, name: { first: req.user!.first_name, last: req.user!.last_name }, role: req.user!.role },
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
