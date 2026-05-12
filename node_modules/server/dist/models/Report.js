"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Report = void 0;
const mongoose_1 = require("mongoose");
const reportSchema = new mongoose_1.Schema({
    eventId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Event', required: true },
    activityId: { type: mongoose_1.Schema.Types.ObjectId },
    authorId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['Update', 'Emergency', 'Accomplishment'], required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    attachments: [
        {
            url: String,
            publicId: String,
            fileType: { type: String, enum: ['image', 'pdf', 'document'] },
        },
    ],
    isResolved: { type: Boolean, default: false },
    resolvedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: Date,
}, { timestamps: true });
exports.Report = (0, mongoose_1.model)('Report', reportSchema);
