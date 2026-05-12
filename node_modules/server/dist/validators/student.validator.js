"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStudentSchema = exports.createStudentSchema = void 0;
const zod_1 = require("zod");
exports.createStudentSchema = zod_1.z.object({
    studentId: zod_1.z.string().min(1),
    name: zod_1.z.object({ first: zod_1.z.string().min(1), last: zod_1.z.string().min(1) }),
    email: zod_1.z.string().email(),
    section: zod_1.z.string().min(1),
    yearLevel: zod_1.z.number().int().min(1).max(4),
});
exports.updateStudentSchema = exports.createStudentSchema.partial();
