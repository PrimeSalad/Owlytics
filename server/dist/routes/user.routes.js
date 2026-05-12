"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const requireAuth_1 = require("../middleware/requireAuth");
const requireRole_1 = require("../middleware/requireRole");
exports.userRouter = (0, express_1.Router)();
exports.userRouter.use(requireAuth_1.requireAuth);
exports.userRouter.get('/', (0, requireRole_1.requireRole)('President', 'Secretary'), user_controller_1.listUsers);
exports.userRouter.post('/', (0, requireRole_1.requireRole)('President'), user_controller_1.createUser);
// Only President can manage accounts
exports.userRouter.patch('/:id', (0, requireRole_1.requireRole)('President'), user_controller_1.updateUser);
exports.userRouter.delete('/:id', (0, requireRole_1.requireRole)('President'), user_controller_1.deactivateUser);
