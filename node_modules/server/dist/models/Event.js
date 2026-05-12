"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Event = void 0;
const mongoose_1 = require("mongoose");
const activityUpdateSchema = new mongoose_1.Schema({
    content: { type: String, required: true },
    attachments: [String],
    submittedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    submittedAt: { type: Date, default: Date.now },
}, { _id: false });
const activitySchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    description: String,
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    committeeId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['Pending', 'InProgress', 'Done'], default: 'Pending' },
    updates: [activityUpdateSchema],
});
const eventSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    description: String,
    venue: String,
    dateRange: {
        start: { type: Date, required: true },
        end: { type: Date, required: true },
    },
    status: {
        type: String,
        enum: ['Planning', 'Ongoing', 'Completed', 'Cancelled'],
        default: 'Planning',
    },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedOfficers: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
    activities: [activitySchema],
}, { timestamps: true });
exports.Event = (0, mongoose_1.model)('Event', eventSchema);
