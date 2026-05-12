import { Router } from 'express';
import {
  createSchedule, getSchedules, scanQR, syncOffline,
  getRecords, exportRecords, markAbsent, getSummary,
} from '../controllers/attendance.controller';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';

export const attendanceRouter = Router();

attendanceRouter.use(requireAuth);

attendanceRouter.post('/schedules', requireRole('Secretary'), createSchedule);
attendanceRouter.get('/schedules/:eventId', getSchedules);
attendanceRouter.post('/scan', requireRole('Attendance'), scanQR);
attendanceRouter.post('/sync', requireRole('Attendance'), syncOffline);
attendanceRouter.get('/records/:eventId', requireRole('Secretary', 'Officer', 'President'), getRecords);
attendanceRouter.get('/records/:eventId/export', requireRole('Secretary', 'Officer', 'President'), exportRecords);
attendanceRouter.post('/mark-absent/:scheduleId', requireRole('Secretary'), markAbsent);
attendanceRouter.get('/summary/:eventId', requireRole('Secretary', 'Officer', 'President'), getSummary);
