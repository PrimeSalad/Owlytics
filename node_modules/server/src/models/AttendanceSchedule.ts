import { Schema, model, Document, Types } from 'mongoose';

type SessionLabel = 'AM In' | 'AM Out' | 'PM In' | 'PM Out';

interface ISession {
  _id: Types.ObjectId;
  label: SessionLabel;
  openAt: Date;
  closeAt: Date;
  gracePeriodMinutes: number;
}

export interface IAttendanceSchedule extends Document {
  eventId: Types.ObjectId;
  label: string;
  sessions: ISession[];
  assignedScanners: Types.ObjectId[];
  createdBy: Types.ObjectId;
}

const sessionSchema = new Schema<ISession>({
  label: { type: String, enum: ['AM In', 'AM Out', 'PM In', 'PM Out'], required: true },
  openAt: { type: Date, required: true },
  closeAt: { type: Date, required: true },
  gracePeriodMinutes: { type: Number, default: 15 },
});

const attendanceScheduleSchema = new Schema<IAttendanceSchedule>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    label: { type: String, required: true },
    sessions: [sessionSchema],
    assignedScanners: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const AttendanceSchedule = model<IAttendanceSchedule>('AttendanceSchedule', attendanceScheduleSchema);
