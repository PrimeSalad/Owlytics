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
  const { qrData, sessionId, scheduleId, eventId, locationData } = scanSchema.parse(req.body);
  const scannerId = req.user!.userId;
  const assignedSectionId = req.assignedSectionId;

  // 1. Parse QR Data: SMS|studentId|fullName|section
  const parts = qrData.split('|');
  if (parts[0] !== 'SMS' || parts.length < 2) {
    throw new AppError(400, 'Invalid QR code format');
  }
  const studentIdText = parts[1];

  // 2. Find student
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id, student_id, first_name, last_name, section_id, section')
    .eq('student_id', studentIdText)
    .single();

  if (studentError || !student) throw new AppError(404, 'Student not found');

  // 3. Section Check for Attendance Staff
  if (assignedSectionId && student.section_id !== assignedSectionId) {
    // If we don't have section_id in students yet, we might have to skip this or match by text
    // For now, let's assume we want to enforce it if possible.
    if (student.section_id) {
       throw new AppError(403, `This student belongs to ${student.section}. You are only authorized for your assigned section.`);
    }
  }

  // 4. Record attendance
  const { data: record, error: recordError } = await supabase
    .from('attendance_records')
    .upsert({
      event_id: eventId,
      schedule_id: scheduleId,
      session_id: sessionId,
      student_id: student.id,
      status: 'Present', // Basic implementation, can be refined with Late logic
      scanned_by: scannerId,
      timestamp: new Date().toISOString(),
      lat: locationData?.lat,
      lng: locationData?.lng,
    }, { onConflict: 'student_id, session_id' })
    .select('*, students(first_name, last_name, student_id)')
    .single();

  if (recordError) throw new AppError(400, recordError.message);

  res.json({
    message: 'Attendance recorded',
    student: {
      name: `${student.first_name} ${student.last_name}`,
      studentId: student.student_id,
    },
    record,
  });
}

export async function syncOffline(req: Request, res: Response) {
  const { scans } = req.body;
  if (!Array.isArray(scans)) throw new AppError(400, 'Invalid scans data');

  const scannerId = req.user!.userId;
  const results = { success: 0, failed: 0, errors: [] as string[] };

  for (const scan of scans) {
    try {
      // Very basic sync logic — can be optimized with bulk insert
      const parts = scan.qrData.split('|');
      const studentIdText = parts[1];

      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('student_id', studentIdText)
        .single();

      if (!student) throw new Error(`Student ${studentIdText} not found`);

      const { error } = await supabase.from('attendance_records').upsert({
        event_id: scan.eventId,
        schedule_id: scan.scheduleId,
        session_id: scan.sessionId,
        student_id: student.id,
        status: scan.status || 'Present',
        scanned_by: scannerId,
        timestamp: scan.timestamp || new Date().toISOString(),
        is_offline_sync: true,
      }, { onConflict: 'student_id, session_id' });

      if (error) throw error;
      results.success++;
    } catch (err: any) {
      results.failed++;
      results.errors.push(err.message);
    }
  }

  res.json({ message: 'Sync complete', ...results });
}

export async function getRecords(req: Request, res: Response) {
  const assignedSectionId = req.assignedSectionId;

  let query = supabase
    .from('attendance_records')
    .select('*, students!inner(id, student_id, first_name, last_name, section_id), profiles!scanned_by(id, first_name, last_name)')
    .eq('event_id', req.params.eventId);

  if (assignedSectionId) {
    query = query.eq('students.section_id', assignedSectionId);
  }

  const { data, error } = await query.order('timestamp', { ascending: false });
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
  const assignedSectionId = req.assignedSectionId;

  // 1. Get students (filtered by section if needed)
  let studentQuery = supabase
    .from('students')
    .select('id, student_id, first_name, last_name, section, section_id')
    .order('section', { ascending: true })
    .order('last_name', { ascending: true });

  if (assignedSectionId) {
    studentQuery = studentQuery.eq('section_id', assignedSectionId);
  }

  const { data: students, error: studentsError } = await studentQuery;

  if (studentsError) throw new AppError(500, studentsError.message);

  // 2. Get all attendance sessions for this event
  const { data: sessions, error: sessionsError } = await supabase
    .from('attendance_sessions')
    .select('id, label, schedule_id, attendance_schedules!inner(event_id)')
    .eq('attendance_schedules.event_id', eventId);

  if (sessionsError) throw new AppError(500, sessionsError.message);

  // 3. Get attendance records for these students
  const studentIds = students.map(s => s.id);
  const { data: records, error: recordsError } = await supabase
    .from('attendance_records')
    .select('student_id, session_id, status')
    .eq('event_id', eventId)
    .in('student_id', studentIds);

  if (recordsError) throw new AppError(500, recordsError.message);

  // 4. Map records for fast lookup
  const recordMap: Record<string, Record<string, string>> = {};
  records.forEach((r) => {
    if (!recordMap[r.student_id]) recordMap[r.student_id] = {};
    recordMap[r.student_id][r.session_id] = r.status;
  });

  // 5. Build summary grouped by section
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
