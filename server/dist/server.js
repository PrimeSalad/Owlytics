"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const app_1 = require("./app");
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
const socket_1 = require("./config/socket");
async function bootstrap() {
    const httpServer = (0, http_1.createServer)(app_1.app);
    const io = new socket_io_1.Server(httpServer, {
        cors: { origin: env_1.env.FRONTEND_URL, credentials: true },
    });
    (0, socket_1.registerSocketHandlers)(io);
    app_1.app.locals.io = io;
    httpServer.listen(env_1.env.PORT, () => {
        logger_1.logger.info(`Server running on port ${env_1.env.PORT} [${env_1.env.NODE_ENV}]`);
    });
}
bootstrap();
