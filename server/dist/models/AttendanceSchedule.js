"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceSchedule = void 0;
const mongoose_1 = require("mongoose");
const sessionSchema = new mongoose_1.Schema({
    label: { type: String, enum: ['AM In', 'AM Out', 'PM In', 'PM Out'], required: true },
    openAt: { type: Date, required: true },
    closeAt: { type: Date, required: true },
    gracePeriodMinutes: { type: Number, default: 15 },
});
const attendanceScheduleSchema = new mongoose_1.Schema({
    eventId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Event', required: true },
    label: { type: String, required: true },
    sessions: [sessionSchema],
    assignedScanners: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
exports.AttendanceSchedule = (0, mongoose_1.model)('AttendanceSchedule', attendanceScheduleSchema);
