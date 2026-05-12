import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';
import { createReportSchema } from '../validators/report.validator';

export async function listReports(req: Request, res: Response) {
  const { type, eventId } = req.query;
  let query = supabase.from('reports')
    .select('*, profiles!author_id(id, first_name, last_name, role)')
    .order('created_at', { ascending: false });
  if (type) query = query.eq('type', type);
  if (eventId) query = query.eq('event_id', eventId);
  const { data, error } = await query;
  if (error) throw new AppError(500, error.message);
  res.json(data);
}

export async function createReport(req: Request, res: Response) {
  const data = createReportSchema.parse(req.body);
  const { data: report, error } = await supabase.from('reports').insert({
    event_id: data.eventId, activity_id: data.activityId,
    author_id: req.user!.userId, type: data.type,
    title: data.title, content: data.content,
  }).select().single();

  if (error) throw new AppError(400, error.message);

  if (data.attachments?.length) {
    await supabase.from('report_attachments').insert(
      data.attachments.map((a) => ({ report_id: report.id, url: a.url, public_id: a.publicId, file_type: a.fileType }))
    );
  }

  if (data.type === 'Emergency') {
    req.app.locals.io?.to('role:President').emit('report:emergency', {
      reportId: report.id, title: report.title,
    });
  }

  res.status(201).json(report);
}

export async function getReport(req: Request, res: Response) {
  const { data, error } = await supabase.from('reports')
    .select('*, profiles!author_id(id, first_name, last_name, role), report_attachments(*)')
    .eq('id', req.params.id).single();
  if (error || !data) throw new AppError(404, 'Report not found');
  res.json(data);
}

export async function resolveReport(req: Request, res: Response) {
  const { error } = await supabase.from('reports').update({
    is_resolved: true, resolved_by: req.user!.userId, resolved_at: new Date().toISOString(),
  }).eq('id', req.params.id);
  if (error) throw new AppError(400, error.message);
  res.json({ message: 'Report resolved' });
}

export async function generateAccomplishment(_req: Request, res: Response) {
  res.json({ message: 'PDF generation endpoint ready — Phase 5' });
}
