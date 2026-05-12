"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    studentId: { type: String, required: true, unique: true, trim: true },
    name: {
        first: { type: String, required: true, trim: true },
        last: { type: String, required: true, trim: true },
    },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: {
        type: String,
        enum: ['President', 'Secretary', 'Officer', 'Committee', 'Attendance'],
        required: true,
    },
    avatarUrl: String,
    assignedCommitteeId: { type: mongoose_1.Schema.Types.ObjectId, default: null },
    isActive: { type: Boolean, default: true },
    lastLogin: Date,
}, { timestamps: true });
exports.User = (0, mongoose_1.model)('User', userSchema);
