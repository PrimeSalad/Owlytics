import { Router } from 'express';
import {
  listEvents, createEvent, getEvent,
  updateEvent, deleteEvent, addActivity, updateActivity,
} from '../controllers/event.controller';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';

export const eventRouter = Router();

eventRouter.use(requireAuth);

eventRouter.get('/', listEvents);
eventRouter.post('/', requireRole('President', 'Officer'), createEvent);
eventRouter.get('/:id', getEvent);
eventRouter.patch('/:id', requireRole('President', 'Officer'), updateEvent);
eventRouter.delete('/:id', requireRole('President'), deleteEvent);
eventRouter.post('/:id/activities', requireRole('Officer'), addActivity);
eventRouter.patch('/:id/activities/:actId', requireRole('Officer', 'Committee'), updateActivity);
