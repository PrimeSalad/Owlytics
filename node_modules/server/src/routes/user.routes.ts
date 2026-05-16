import { Router } from 'express';
import { listUsers, createUser, updateUser, deactivateUser } from '../controllers/user.controller';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';

export const userRouter = Router();

userRouter.use(requireAuth);

userRouter.get('/', requireRole('President', 'Secretary', 'Officer'), listUsers);
userRouter.post('/', requireRole('President'), createUser);
// Any authenticated user can patch themselves, controller handles permissions
userRouter.patch('/:id', updateUser);
userRouter.delete('/:id', requireRole('President'), deactivateUser);
