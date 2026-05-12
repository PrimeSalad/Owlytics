"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activitySchema = exports.updateEventSchema = exports.createEventSchema = void 0;
const zod_1 = require("zod");
exports.createEventSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    venue: zod_1.z.string().optional(),
    dateRange: zod_1.z.object({ start: zod_1.z.coerce.date(), end: zod_1.z.coerce.date() }),
    assignedOfficers: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.updateEventSchema = exports.createEventSchema.partial().extend({
    status: zod_1.z.enum(['Planning', 'Ongoing', 'Completed', 'Cancelled']).optional(),
});
exports.activitySchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    startTime: zod_1.z.coerce.date(),
    endTime: zod_1.z.coerce.date(),
    committeeId: zod_1.z.string().optional(),
});
