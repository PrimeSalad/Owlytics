"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Student = void 0;
const mongoose_1 = require("mongoose");
const studentSchema = new mongoose_1.Schema({
    studentId: { type: String, required: true, unique: true, trim: true },
    name: {
        first: { type: String, required: true, trim: true },
        last: { type: String, required: true, trim: true },
    },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    section: { type: String, required: true, trim: true },
    yearLevel: { type: Number, required: true, min: 1, max: 4 },
    qrCodeData: String,
    qrCodeUrl: String,
    attendanceHistory: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'AttendanceRecord' }],
    importBatchId: String,
}, { timestamps: true });
studentSchema.index({ 'name.first': 'text', 'name.last': 'text', studentId: 'text' });
exports.Student = (0, mongoose_1.model)('Student', studentSchema);
