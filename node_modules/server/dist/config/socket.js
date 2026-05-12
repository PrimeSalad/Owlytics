"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSocketHandlers = registerSocketHandlers;
const logger_1 = require("../utils/logger");
function registerSocketHandlers(io) {
    io.on('connection', (socket) => {
        logger_1.logger.debug(`Socket connected: ${socket.id}`);
        socket.on('join:event', ({ eventId }) => {
            socket.join(`event:${eventId}`);
        });
        socket.on('leave:event', ({ eventId }) => {
            socket.leave(`event:${eventId}`);
        });
        socket.on('join:role', ({ role }) => {
            socket.join(`role:${role}`);
        });
        socket.on('disconnect', () => {
            logger_1.logger.debug(`Socket disconnected: ${socket.id}`);
        });
    });
}
