"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
const roles = ['President', 'Secretary', 'Officer', 'Committee', 'Attendance'];
exports.createUserSchema = zod_1.z.object({
    studentId: zod_1.z.string().min(1),
    name: zod_1.z.object({ first: zod_1.z.string().min(1), last: zod_1.z.string().min(1) }),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    role: zod_1.z.enum(roles),
});
exports.updateUserSchema = zod_1.z.object({
    role: zod_1.z.enum(roles).optional(),
    isActive: zod_1.z.boolean().optional(),
    assignedCommitteeId: zod_1.z.string().nullable().optional(),
    assignedSection: zod_1.z.string().nullable().optional(),
});
