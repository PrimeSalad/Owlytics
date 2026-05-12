import { Schema, model, Document, Types } from 'mongoose';

export interface IStudent extends Document {
  studentId: string;
  name: { first: string; last: string };
  email: string;
  section: string;
  yearLevel: number;
  qrCodeData?: string;
  qrCodeUrl?: string;
  attendanceHistory: Types.ObjectId[];
  importBatchId?: string;
}

const studentSchema = new Schema<IStudent>(
  {
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
    attendanceHistory: [{ type: Schema.Types.ObjectId, ref: 'AttendanceRecord' }],
    importBatchId: String,
  },
  { timestamps: true }
);

studentSchema.index({ 'name.first': 'text', 'name.last': 'text', studentId: 'text' });

export const Student = model<IStudent>('Student', studentSchema);
