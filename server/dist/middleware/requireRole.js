"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
const errorHandler_1 = require("./errorHandler");
function requireRole(...roles) {
    return (req, _res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            throw new errorHandler_1.AppError(403, 'Insufficient permissions');
        }
        next();
    };
}
