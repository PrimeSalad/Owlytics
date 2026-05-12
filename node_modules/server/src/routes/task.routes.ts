import { Router } from 'express';
import { listTasks, getMyTasks, createTask, updateTask, addComment, deleteTask } from '../controllers/task.controller';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';

export const taskRouter = Router();

taskRouter.use(requireAuth);

taskRouter.get('/mine', getMyTasks);
taskRouter.get('/', listTasks);
taskRouter.post('/:id/comments', addComment);

taskRouter.post('/', requireRole('President', 'Secretary', 'Officer'), createTask);
taskRouter.patch('/:id', requireRole('President', 'Secretary', 'Officer'), updateTask);
taskRouter.delete('/:id', requireRole('President', 'Secretary', 'Officer'), deleteTask);
