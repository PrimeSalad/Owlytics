import { Schema, model, Document, Types } from 'mongoose';

export type UserRole = 'President' | 'Secretary' | 'Officer' | 'Committee' | 'Attendance';

export interface IUser extends Document {
  studentId: string;
  name: { first: string; last: string };
  email: string;
  password: string;
  role: UserRole;
  avatarUrl?: string;
  assignedCommitteeId?: Types.ObjectId;
  isActive: boolean;
  lastLogin?: Date;
}

const userSchema = new Schema<IUser>(
  {
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
    assignedCommitteeId: { type: Schema.Types.ObjectId, default: null },
    isActive: { type: Boolean, default: true },
    lastLogin: Date,
  },
  { timestamps: true }
);

export const User = model<IUser>('User', userSchema);
