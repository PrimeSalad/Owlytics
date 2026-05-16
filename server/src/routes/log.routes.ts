import { Router } from 'express';
import { getLogs } from '../controllers/log.controller';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';

export const logRouter = Router();

// Only President can access system logs
logRouter.use(requireAuth, requireRole('President'));

logRouter.get('/', getLogs);
