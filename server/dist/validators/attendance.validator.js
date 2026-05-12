"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanSchema = exports.createScheduleSchema = void 0;
const zod_1 = require("zod");
const sessionLabels = ['AM In', 'AM Out', 'PM In', 'PM Out'];
exports.createScheduleSchema = zod_1.z.object({
    eventId: zod_1.z.string().min(1),
    label: zod_1.z.string().min(1),
    sessions: zod_1.z.array(zod_1.z.object({
        label: zod_1.z.enum(sessionLabels),
        openAt: zod_1.z.coerce.date(),
        closeAt: zod_1.z.coerce.date(),
        gracePeriodMinutes: zod_1.z.number().int().min(0).default(15),
    })),
    assignedScanners: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.scanSchema = zod_1.z.object({
    qrData: zod_1.z.string().min(1),
    sessionId: zod_1.z.string().min(1),
    scheduleId: zod_1.z.string().min(1),
    eventId: zod_1.z.string().min(1),
    locationData: zod_1.z.object({ lat: zod_1.z.number(), lng: zod_1.z.number() }).optional(),
});
