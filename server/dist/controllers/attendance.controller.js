"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSchedule = createSchedule;
exports.getSchedules = getSchedules;
exports.scanQR = scanQR;
exports.syncOffline = syncOffline;
exports.getRecords = getRecords;
exports.exportRecords = exportRecords;
exports.markAbsent = markAbsent;
const supabase_1 = require("../config/supabase");
const errorHandler_1 = require("../middleware/errorHandler");
const attendance_validator_1 = require("../validators/attendance.validator");
async function createSchedule(req, res) {
    const data = attendance_validator_1.createScheduleSchema.parse(req.body);
    const { data: schedule, error } = await supabase_1.supabase.from('attendance_schedules').insert({
        event_id: data.eventId, label: data.label, created_by: req.user.userId,
    }).select().single();
    if (error)
        throw new errorHandler_1.AppError(400, error.message);
    if (data.sessions?.length) {
        const { error: sessionsError } = await supabase_1.supabase.from('attendance_sessions').insert(data.sessions.map((s) => ({
            schedule_id: schedule.id, label: s.label,
            open_at: s.openAt, close_at: s.closeAt,
            grace_period_minutes: s.gracePeriodMinutes,
        })));
        if (sessionsError) {
            await supabase_1.supabase.from('attendance_schedules').delete().eq('id', schedule.id);
            throw new errorHandler_1.AppError(400, sessionsError.message);
        }
    }
    if (data.assignedScanners?.length) {
        const { error: scannersError } = await supabase_1.supabase.from('attendance_schedule_scanners').insert(data.assignedScanners.map((scannerId) => ({
            schedule_id: schedule.id,
            scanner_id: scannerId,
        })));
        if (scannersError) {
            await supabase_1.supabase.from('attendance_schedules').delete().eq('id', schedule.id);
            throw new errorHandler_1.AppError(400, scannersError.message);
        }
    }
    res.status(201).json(schedule);
}
async function getSchedules(req, res) {
    const { data, error } = await supabase_1.supabase
        .from('attendance_schedules')
        .select('*, attendance_sessions(*)')
        .eq('event_id', req.params.eventId);
    if (error)
        throw new errorHandler_1.AppError(500, error.message);
    res.json(data);
}
async function scanQR(req, res) {
    const { qrData, sessionId, scheduleId, eventId } = attendance_validator_1.scanSchema.parse(req.body);
    // Full QR validation in Phase 4
    res.json({ message: 'Scan received', qrData, sessionId, scheduleId, eventId });
}
async function syncOffline(req, res) {
    res.json({ message: 'Sync endpoint ready', received: Array.isArray(req.body.scans) ? req.body.scans.length : 0 });
}
async function getRecords(req, res) {
    const { data, error } = await supabase_1.supabase
        .from('attendance_records')
        .select('*, students(id, student_id, first_name, last_name), profiles!scanned_by(id, first_name, last_name)')
        .eq('event_id', req.params.eventId)
        .order('timestamp', { ascending: false });
    if (error)
        throw new errorHandler_1.AppError(500, error.message);
    res.json(data);
}
async function exportRecords(_req, res) {
    res.json({ message: 'Export endpoint ready — Phase 4' });
}
async function markAbsent(req, res) {
    const { data: schedule } = await supabase_1.supabase.from('attendance_schedules').select('id').eq('id', req.params.scheduleId).single();
    if (!schedule)
        throw new errorHandler_1.AppError(404, 'Schedule not found');
    res.json({ message: 'Absent marking triggered — Phase 4' });
}
