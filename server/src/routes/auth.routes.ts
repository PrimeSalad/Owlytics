import { Router } from 'express';
import { login, logout, getMe, changePassword } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/requireAuth';
import { loginLimiter } from '../middleware/rateLimiter';

export const authRouter = Router();

authRouter.post('/login', loginLimiter, login);
authRouter.post('/logout', requireAuth, logout);
authRouter.get('/me', requireAuth, getMe);
authRouter.patch('/me/password', requireAuth, changePassword);
