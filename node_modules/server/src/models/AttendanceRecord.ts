import { Schema, model, Document, Types } from 'mongoose';

export interface IAttendanceRecord extends Document {
  eventId: Types.ObjectId;
  scheduleId: Types.ObjectId;
  sessionId: Types.ObjectId;
  studentId: Types.ObjectId;
  status: 'Present' | 'Late' | 'Absent';
  scannedBy?: Types.ObjectId;
  timestamp: Date;
  locationData?: { lat: number; lng: number };
  isOfflineSync: boolean;
}

const attendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    scheduleId: { type: Schema.Types.ObjectId, ref: 'AttendanceSchedule', required: true },
    sessionId: { type: Schema.Types.ObjectId, required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    status: { type: String, enum: ['Present', 'Late', 'Absent'], required: true },
    scannedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
    locationData: { lat: Number, lng: Number },
    isOfflineSync: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Prevent duplicate scans for same student in same session
attendanceRecordSchema.index({ studentId: 1, sessionId: 1 }, { unique: true });

export const AttendanceRecord = model<IAttendanceRecord>('AttendanceRecord', attendanceRecordSchema);
