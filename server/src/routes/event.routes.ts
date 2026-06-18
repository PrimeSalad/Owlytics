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
// Officers can edit event details; the controller additionally restricts
// *status* changes to President / Secretary (and their aliases Adviser / VP).
eventRouter.patch('/:id', requireRole('President', 'Secretary', 'Officer'), updateEvent);
eventRouter.delete('/:id', requireRole('President'), deleteEvent);
eventRouter.post('/:id/activities', requireRole('President', 'Secretary', 'Officer'), addActivity);
eventRouter.patch('/:id/activities/:actId', requireRole('President', 'Secretary', 'Officer', 'Committee'), updateActivity);
