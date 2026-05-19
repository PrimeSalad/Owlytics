import { Router } from 'express';
import {
  listReports, createReport, getReport,
  approveReport, rejectReport, resolveReport,
  compileAccomplishment, compileAccomplishmentWord, listExports, deleteReport, exportSingleReport
} from '../controllers/report.controller';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';
import { upload } from '../middleware/upload';

export const reportRouter = Router();
reportRouter.use(requireAuth);

// Specific routes before /:id
reportRouter.get('/exports/:eventId',       requireRole('Secretary', 'President'), listExports);
reportRouter.post('/compile/:eventId',      requireRole('Secretary', 'President'), compileAccomplishment);
reportRouter.post('/compile-word/:eventId', requireRole('Secretary', 'President'), compileAccomplishmentWord);

reportRouter.get('/',                  listReports);
reportRouter.post('/', upload.array('images', 5), createReport);

reportRouter.get('/:id',               getReport);
reportRouter.get('/:id/export-pdf',    exportSingleReport);
reportRouter.delete('/:id',            deleteReport);
reportRouter.patch('/:id/approve',     requireRole('Officer', 'Secretary', 'President'), approveReport);
reportRouter.patch('/:id/reject',      requireRole('Officer', 'Secretary', 'President'), rejectReport);
reportRouter.patch('/:id/resolve',     requireRole('Officer', 'Secretary', 'President'), resolveReport);
