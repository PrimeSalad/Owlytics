import { Router } from 'express';
import { listTasks, createTask, updateTask, addComment, deleteTask } from '../controllers/task.controller';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';

export const taskRouter = Router();

taskRouter.use(requireAuth);
taskRouter.use(requireRole('President', 'Secretary', 'Officer'));

taskRouter.get('/', listTasks);
taskRouter.post('/', createTask);
taskRouter.patch('/:id', updateTask);
taskRouter.post('/:id/comments', addComment);
taskRouter.delete('/:id', deleteTask);
