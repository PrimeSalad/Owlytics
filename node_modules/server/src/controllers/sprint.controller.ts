import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';

export async function listSprints(_req: Request, res: Response) {
  const { data, error } = await supabase
    .from('sprints')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new AppError(500, error.message);
  res.json((data ?? []).map((s) => ({
    _id: s.id, name: s.name, goal: s.goal, status: s.status,
    startDate: s.start_date, endDate: s.end_date,
    createdBy: s.created_by, createdAt: s.created_at,
  })));
}

export async function createSprint(req: Request, res: Response) {
  const { name, goal, startDate, endDate } = req.body;
  if (!name?.trim()) throw new AppError(400, 'Sprint name is required');
  const { data, error } = await supabase.from('sprints').insert({
    name: name.trim(), goal, status: 'Planning',
    start_date: startDate || null, end_date: endDate || null,
    created_by: req.user!.userId,
  }).select().single();
  if (error) throw new AppError(400, error.message);
  res.status(201).json({ _id: data.id, name: data.name, goal: data.goal, status: data.status, startDate: data.start_date, endDate: data.end_date, createdAt: data.created_at });
}

export async function updateSprint(req: Request, res: Response) {
  const { name, goal, status, startDate, endDate } = req.body;
  const update: Record<string, unknown> = {};
  if (name) update.name = name;
  if (goal !== undefined) update.goal = goal;
  if (status) update.status = status;
  if (startDate !== undefined) update.start_date = startDate;
  if (endDate !== undefined) update.end_date = endDate;
  const { error } = await supabase.from('sprints').update(update).eq('id', req.params.id);
  if (error) throw new AppError(400, error.message);
  res.json({ message: 'Sprint updated' });
}

export async function deleteSprint(req: Request, res: Response) {
  await supabase.from('sprints').delete().eq('id', req.params.id);
  res.json({ message: 'Sprint deleted' });
}
