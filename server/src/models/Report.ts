import { Schema, model, Document, Types } from 'mongoose';

interface IAttachment {
  url: string;
  publicId: string;
  fileType: 'image' | 'pdf' | 'document';
}

export interface IReport extends Document {
  eventId: Types.ObjectId;
  activityId?: Types.ObjectId;
  authorId: Types.ObjectId;
  type: 'Update' | 'Emergency' | 'Accomplishment';
  title: string;
  content: string;
  attachments: IAttachment[];
  isResolved: boolean;
  resolvedBy?: Types.ObjectId;
  resolvedAt?: Date;
}

const reportSchema = new Schema<IReport>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    activityId: { type: Schema.Types.ObjectId },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
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
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: Date,
  },
  { timestamps: true }
);

export const Report = model<IReport>('Report', reportSchema);
