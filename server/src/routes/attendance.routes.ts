import { Router } from 'express';
import {
  createSchedule, getSchedules, scanQR, syncOffline,
  getRecords, exportRecords, markAbsent, getSummary,
} from '../controllers/attendance.controller';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';
import { requireSectionAccess, filterByAssignedSection } from '../middleware/requireSectionAccess';

export const attendanceRouter = Router();

attendanceRouter.use(requireAuth);

attendanceRouter.post('/schedules', requireRole('President', 'Secretary'), createSchedule);
attendanceRouter.get('/schedules/:eventId', getSchedules);
attendanceRouter.post('/scan', requireRole('Attendance'), requireSectionAccess, scanQR);
attendanceRouter.post('/sync', requireRole('Attendance'), requireSectionAccess, syncOffline);
attendanceRouter.get('/records/:eventId', requireRole('Secretary', 'Officer', 'President', 'Attendance'), filterByAssignedSection, getRecords);
attendanceRouter.get('/records/:eventId/export', requireRole('Secretary', 'Officer', 'President'), filterByAssignedSection, exportRecords);
attendanceRouter.post('/mark-absent/:scheduleId', requireRole('Secretary'), markAbsent);
attendanceRouter.get('/summary/:eventId', requireRole('Secretary', 'Officer', 'President', 'Attendance'), filterByAssignedSection, getSummary);
