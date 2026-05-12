import { Router } from 'express';
import { getNotifications, markAsRead, broadcastAnnouncement } from '../controllers/notification.controller';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';

export const notificationRouter = Router();

notificationRouter.use(requireAuth);

notificationRouter.get('/', getNotifications);
notificationRouter.patch('/:id/read', markAsRead);
notificationRouter.post('/broadcast', requireRole('President'), broadcastAnnouncement);
