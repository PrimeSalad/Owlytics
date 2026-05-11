import { Schema, model, Document, Types } from 'mongoose';

interface IActivityUpdate {
  content: string;
  attachments: string[];
  submittedBy: Types.ObjectId;
  submittedAt: Date;
}

interface IActivity {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  committeeId?: Types.ObjectId;
  status: 'Pending' | 'InProgress' | 'Done';
  updates: IActivityUpdate[];
}

export interface IEvent extends Document {
  title: string;
  description?: string;
  venue?: string;
  dateRange: { start: Date; end: Date };
  status: 'Planning' | 'Ongoing' | 'Completed' | 'Cancelled';
  createdBy: Types.ObjectId;
  assignedOfficers: Types.ObjectId[];
  activities: IActivity[];
}

const activityUpdateSchema = new Schema<IActivityUpdate>(
  {
    content: { type: String, required: true },
    attachments: [String],
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const activitySchema = new Schema<IActivity>({
  name: { type: String, required: true },
  description: String,
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  committeeId: { type: Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['Pending', 'InProgress', 'Done'], default: 'Pending' },
  updates: [activityUpdateSchema],
});

const eventSchema = new Schema<IEvent>(
  {
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
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedOfficers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    activities: [activitySchema],
  },
  { timestamps: true }
);

export const Event = model<IEvent>('Event', eventSchema);
