"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReportSchema = void 0;
const zod_1 = require("zod");
exports.createReportSchema = zod_1.z.object({
    eventId: zod_1.z.string().min(1),
    activityId: zod_1.z.string().optional(),
    type: zod_1.z.enum(['Update', 'Emergency', 'Accomplishment']),
    title: zod_1.z.string().min(1),
    content: zod_1.z.string().min(1),
    attachments: zod_1.z.array(zod_1.z.object({
        url: zod_1.z.string().url(),
        publicId: zod_1.z.string(),
        fileType: zod_1.z.enum(['image', 'pdf', 'document']),
    })).optional(),
});
