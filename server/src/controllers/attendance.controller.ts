import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';
import { createScheduleSchema, scanSchema } from '../validators/attendance.validator';

export async function createSchedule(req: Request, res: Response) {
  const data = createScheduleSchema.parse(req.body);

  const { data: schedule, error } = await supabase.from('attendance_schedules').insert({
    event_id: data.eventId, label: data.label, created_by: req.user!.userId,
  }).select().single();
  if (error) throw new AppError(400, error.message);

  if (data.sessions?.length) {
    await supabase.from('attendance_sessions').insert(
      data.sessions.map((s) => ({
        schedule_id: schedule.id, label: s.label,
        open_at: s.openAt, close_at: s.closeAt,
        grace_period_minutes: s.gracePeriodMinutes,
      }))
    );
  }

  res.status(201).json(schedule);
}

export async function getSchedules(req: Request, res: Response) {
  const { data, error } = await supabase
    .from('attendance_schedules')
    .select('*, attendance_sessions(*)')
    .eq('event_id', req.params.eventId);
  if (error) throw new AppError(500, error.message);
  res.json(data);
}

export async function scanQR(req: Request, res: Response) {
  const { qrData, sessionId, scheduleId, eventId } = scanSchema.parse(req.body);
  // Full QR validation in Phase 4
  res.json({ message: 'Scan received', qrData, sessionId, scheduleId, eventId });
}

export async function syncOffline(req: Request, res: Response) {
  res.json({ message: 'Sync endpoint ready', received: Array.isArray(req.body.scans) ? req.body.scans.length : 0 });
}

export async function getRecords(req: Request, res: Response) {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*, students(id, student_id, first_name, last_name), profiles!scanned_by(id, first_name, last_name)')
    .eq('event_id', req.params.eventId)
    .order('timestamp', { ascending: false });
  if (error) throw new AppError(500, error.message);
  res.json(data);
}

export async function exportRecords(_req: Request, res: Response) {
  res.json({ message: 'Export endpoint ready — Phase 4' });
}

export async function markAbsent(req: Request, res: Response) {
  const { data: schedule } = await supabase.from('attendance_schedules').select('id').eq('id', req.params.scheduleId).single();
  if (!schedule) throw new AppError(404, 'Schedule not found');
  res.json({ message: 'Absent marking triggered — Phase 4' });
}
