import 'express-async-errors';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env, allowedOrigins } from './config/env';
import { supabase } from './config/supabase';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth.routes';
import { userRouter } from './routes/user.routes';
import { studentRouter } from './routes/student.routes';
import { eventRouter } from './routes/event.routes';
import { attendanceRouter } from './routes/attendance.routes';
import { reportRouter } from './routes/report.routes';
import { notificationRouter } from './routes/notification.routes';
import { taskRouter } from './routes/task.routes';
import { sprintRouter } from './routes/sprint.routes';
import { logRouter } from './routes/log.routes';
import { sectionRouter } from './routes/section.routes';
import { messageRouter } from './routes/message.routes';

const app = express();

// ── Security ──────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients (no Origin header) and any configured origin.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);

// ── Parsing ───────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Logging ───────────────────────────────────────────
if (env.NODE_ENV !== 'test') app.use(morgan('dev'));

// ── Routes ────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/students', studentRouter);
app.use('/api/events', eventRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/reports', reportRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/sprints', sprintRouter);
app.use('/api/logs', logRouter);
app.use('/api/sections', sectionRouter);
app.use('/api/messages', messageRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Keep-alive target for the scheduled GitHub Action: waking Render also runs a
// tiny DB query so Supabase sees activity and never auto-pauses.
app.get('/api/ping', async (_req, res) => {
  const { error } = await supabase.from('profiles').select('id', { head: true, count: 'exact' }).limit(1);
  res.status(error ? 503 : 200).json({ status: error ? 'degraded' : 'ok', supabase: error ? error.message : 'ok' });
});

// ── Error handler (must be last) ──────────────────────
app.use(errorHandler);

export { app };
