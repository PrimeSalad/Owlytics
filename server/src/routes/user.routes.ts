import { Router } from 'express';
import { listUsers, createUser, updateUser, deactivateUser } from '../controllers/user.controller';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';

export const userRouter = Router();

userRouter.use(requireAuth);

userRouter.get('/', requireRole('President', 'Secretary'), listUsers);
userRouter.post('/', requireRole('President'), createUser);
userRouter.patch('/:id', requireRole('President'), updateUser);
userRouter.delete('/:id', requireRole('President'), deactivateUser);
