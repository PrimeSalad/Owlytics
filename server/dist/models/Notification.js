"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const mongoose_1 = require("mongoose");
const notificationSchema = new mongoose_1.Schema({
    recipientId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['Emergency', 'EventUpdate', 'AttendanceAlert', 'System'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedId: mongoose_1.Schema.Types.ObjectId,
    isRead: { type: Boolean, default: false },
}, { timestamps: true });
notificationSchema.index({ recipientId: 1, isRead: 1 });
exports.Notification = (0, mongoose_1.model)('Notification', notificationSchema);
