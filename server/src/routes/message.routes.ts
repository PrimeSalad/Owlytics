import { Router } from 'express';
import { listMessages, createMessage } from '../controllers/message.controller';
import { requireAuth } from '../middleware/requireAuth';

export const messageRouter = Router();

messageRouter.use(requireAuth);

messageRouter.get('/', listMessages);
messageRouter.post('/', createMessage);
