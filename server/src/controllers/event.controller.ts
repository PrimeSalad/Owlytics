import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';
import { createEventSchema, updateEventSchema, activitySchema } from '../validators/event.validator';

function formatEvent(e: Record<string, unknown>, officers: unknown[] = [], activities: unknown[] = []) {
  return {
    _id: e.id, title: e.title, description: e.description, venue: e.venue,
    dateRange: { start: e.start_date, end: e.end_date },
    status: e.status, createdBy: e.created_by,
    assignedOfficers: officers, activities, createdAt: e.created_at,
  };
}

export async function listEvents(req: Request, res: Response) {
  const { status } = req.query;
  let query = supabase.from('events').select('*').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data: events, error } = await query;
  if (error) throw new AppError(500, error.message);

  // Fetch officers and activities for each event
  const result = await Promise.all((events ?? []).map(async (e) => {
    const { data: officers } = await supabase
      .from('event_officers')
      .select('profiles(id, first_name, last_name, role)')
      .eq('event_id', e.id);
    const { data: activities } = await supabase
      .from('activities')
      .select('*')
      .eq('event_id', e.id);
    return formatEvent(e, officers?.map((o: any) => o.profiles) ?? [], activities ?? []);
  }));

  res.json(result);
}

export async function createEvent(req: Request, res: Response) {
  const data = createEventSchema.parse(req.body);
  const { data: event, error } = await supabase.from('events').insert({
    title: data.title, description: data.description, venue: data.venue,
    start_date: data.dateRange.start, end_date: data.dateRange.end,
    created_by: req.user!.userId,
  }).select().single();

  if (error) throw new AppError(400, error.message);

  if (data.assignedOfficers?.length) {
    await supabase.from('event_officers').insert(
      data.assignedOfficers.map((id) => ({ event_id: event.id, officer_id: id }))
    );
  }

  res.status(201).json(formatEvent(event));
}

export async function getEvent(req: Request, res: Response) {
  const { data: event, error } = await supabase.from('events').select('*').eq('id', req.params.id).single();
  if (error || !event) throw new AppError(404, 'Event not found');

  const { data: officers } = await supabase.from('event_officers')
    .select('profiles(id, first_name, last_name, role)').eq('event_id', event.id);
  const { data: activities } = await supabase.from('activities').select('*').eq('event_id', event.id);

  res.json(formatEvent(event, officers?.map((o: any) => o.profiles) ?? [], activities ?? []));
}

export async function updateEvent(req: Request, res: Response) {
  const data = updateEventSchema.parse(req.body);
  const update: Record<string, unknown> = {};
  if (data.title) update.title = data.title;
  if (data.description !== undefined) update.description = data.description;
  if (data.venue !== undefined) update.venue = data.venue;
  if (data.dateRange) { update.start_date = data.dateRange.start; update.end_date = data.dateRange.end; }
  if (data.status) update.status = data.status;

  const { error } = await supabase.from('events').update(update).eq('id', req.params.id);
  if (error) throw new AppError(400, error.message);
  res.json({ message: 'Updated' });
}

export async function deleteEvent(req: Request, res: Response) {
  await supabase.from('events').delete().eq('id', req.params.id);
  res.json({ message: 'Event deleted' });
}

export async function addActivity(req: Request, res: Response) {
  const data = activitySchema.parse(req.body);
  const { data: activity, error } = await supabase.from('activities').insert({
    event_id: req.params.id, name: data.name, description: data.description,
    start_time: data.startTime, end_time: data.endTime, committee_id: data.committeeId,
  }).select().single();

  if (error) throw new AppError(400, error.message);
  res.status(201).json(activity);
}

export async function updateActivity(req: Request, res: Response) {
  const { status, name, description } = req.body;
  const update: Record<string, unknown> = {};
  if (status) update.status = status;
  if (name) update.name = name;
  if (description !== undefined) update.description = description;

  const { error } = await supabase.from('activities').update(update).eq('id', req.params.actId);
  if (error) throw new AppError(400, error.message);
  res.json({ message: 'Activity updated' });
}
