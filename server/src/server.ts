import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { app } from './app';
import { env, allowedOrigins } from './config/env';
import { logger } from './utils/logger';
import { registerSocketHandlers } from './config/socket';

async function bootstrap() {
  const httpServer = createServer(app);

  const io = new SocketServer(httpServer, {
    cors: { origin: allowedOrigins, credentials: true },
  });

  registerSocketHandlers(io);
  app.locals.io = io;

  httpServer.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
}

bootstrap();
