import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';

export function registerSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    logger.debug(`Socket connected: ${socket.id}`);

    socket.on('join:event', ({ eventId }: { eventId: string }) => {
      socket.join(`event:${eventId}`);
    });

    socket.on('leave:event', ({ eventId }: { eventId: string }) => {
      socket.leave(`event:${eventId}`);
    });

    socket.on('join:role', ({ role }: { role: string }) => {
      socket.join(`role:${role}`);
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });
}
