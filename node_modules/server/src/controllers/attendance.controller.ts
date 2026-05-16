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
    const { error: sessionsError } = await supabase.from('attendance_sessions').insert(
      data.sessions.map((s) => ({
        schedule_id: schedule.id, label: s.label,
        open_at: s.openAt, close_at: s.closeAt,
        grace_period_minutes: s.gracePeriodMinutes,
      }))
    );
    if (sessionsError) {
      await supabase.from('attendance_schedules').delete().eq('id', schedule.id);
      throw new AppError(400, sessionsError.message);
    }
  }

  if (data.assignedScanners?.length) {
    const { error: scannersError } = await supabase.from('attendance_schedule_scanners').insert(
      data.assignedScanners.map((scannerId) => ({
        schedule_id: schedule.id,
        scanner_id: scannerId,
      }))
    );
    if (scannersError) {
      await supabase.from('attendance_schedules').delete().eq('id', schedule.id);
      throw new AppError(400, scannersError.message);
    }
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

export async function getSummary(req: Request, res: Response) {
  const { eventId } = req.params;

  // 1. Get all students to know who SHOULD be there
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id, student_id, first_name, last_name, section')
    .order('section', { ascending: true })
    .order('last_name', { ascending: true });

  if (studentsError) throw new AppError(500, studentsError.message);

  // 2. Get all attendance sessions for this event to know the columns
  const { data: sessions, error: sessionsError } = await supabase
    .from('attendance_sessions')
    .select('id, label, schedule_id, attendance_schedules!inner(event_id)')
    .eq('attendance_schedules.event_id', eventId);

  if (sessionsError) throw new AppError(500, sessionsError.message);

  // 3. Get all attendance records for this event
  const { data: records, error: recordsError } = await supabase
    .from('attendance_records')
    .select('student_id, session_id, status')
    .eq('event_id', eventId);

  if (recordsError) throw new AppError(500, recordsError.message);

  // 4. Map records for fast lookup: studentId -> sessionId -> status
  const recordMap: Record<string, Record<string, string>> = {};
  records.forEach((r) => {
    if (!recordMap[r.student_id]) recordMap[r.student_id] = {};
    recordMap[r.student_id][r.session_id] = r.status;
  });

  // 5. Build summary
  // We want to group by section
  const sections: Record<string, any[]> = {};
  
  students.forEach((s) => {
    const studentAttendance: any = {
      id: s.id,
      studentId: s.student_id,
      name: `${s.first_name} ${s.last_name}`,
      attendance: {}
    };

    sessions.forEach((sess) => {
      studentAttendance.attendance[sess.id] = recordMap[s.id]?.[sess.id] || 'Absent';
    });

    if (!sections[s.section]) sections[s.section] = [];
    sections[s.section].push(studentAttendance);
  });

  res.json({
    sessions: sessions.map(s => ({ id: s.id, label: s.label })),
    sections
  });
}
