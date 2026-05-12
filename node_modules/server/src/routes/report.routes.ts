import { Router } from 'express';
import {
  listReports, createReport, getReport,
  resolveReport, generateAccomplishment,
} from '../controllers/report.controller';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';

export const reportRouter = Router();

reportRouter.use(requireAuth);

reportRouter.get('/', requireRole('Officer', 'President', 'Secretary'), listReports);
reportRouter.post('/', requireRole('Committee', 'Officer'), createReport);
reportRouter.get('/:id', getReport);
reportRouter.patch('/:id/resolve', requireRole('President', 'Officer'), resolveReport);
reportRouter.post('/accomplishment/:eventId', requireRole('Secretary', 'President'), generateAccomplishment);
