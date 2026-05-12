"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
class AppError extends Error {
    statusCode;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
function errorHandler(err, _req, res, _next) {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
    }
    if (err instanceof zod_1.ZodError) {
        res.status(422).json({ error: 'Validation failed', issues: err.flatten().fieldErrors });
        return;
    }
    logger_1.logger.error(err);
    res.status(500).json({ error: 'Internal server error' });
}
