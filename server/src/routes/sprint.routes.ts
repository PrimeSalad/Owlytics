import { Router } from 'express';
import { listSprints, createSprint, updateSprint, deleteSprint } from '../controllers/sprint.controller';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';

export const sprintRouter = Router();
sprintRouter.use(requireAuth);

sprintRouter.get('/', listSprints);
sprintRouter.post('/', requireRole('President', 'Secretary', 'Officer'), createSprint);
sprintRouter.patch('/:id', requireRole('President', 'Secretary', 'Officer'), updateSprint);
sprintRouter.delete('/:id', requireRole('President', 'Secretary', 'Officer'), deleteSprint);
