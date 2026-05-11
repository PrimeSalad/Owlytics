import { Schema, model, Document, Types } from 'mongoose';

export interface INotification extends Document {
  recipientId: Types.ObjectId;
  type: 'Emergency' | 'EventUpdate' | 'AttendanceAlert' | 'System';
  title: string;
  message: string;
  relatedId?: Types.ObjectId;
  isRead: boolean;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['Emergency', 'EventUpdate', 'AttendanceAlert', 'System'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedId: Schema.Types.ObjectId,
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ recipientId: 1, isRead: 1 });

export const Notification = model<INotification>('Notification', notificationSchema);
