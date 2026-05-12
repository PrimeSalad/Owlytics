"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceRecord = void 0;
const mongoose_1 = require("mongoose");
const attendanceRecordSchema = new mongoose_1.Schema({
    eventId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Event', required: true },
    scheduleId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'AttendanceSchedule', required: true },
    sessionId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    studentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Student', required: true },
    status: { type: String, enum: ['Present', 'Late', 'Absent'], required: true },
    scannedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
    locationData: { lat: Number, lng: Number },
    isOfflineSync: { type: Boolean, default: false },
}, { timestamps: true });
// Prevent duplicate scans for same student in same session
attendanceRecordSchema.index({ studentId: 1, sessionId: 1 }, { unique: true });
exports.AttendanceRecord = (0, mongoose_1.model)('AttendanceRecord', attendanceRecordSchema);
