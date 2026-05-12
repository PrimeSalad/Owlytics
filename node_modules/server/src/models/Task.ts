import { Schema, model, Document, Types } from 'mongoose';

interface ITaskComment {
  userId: Types.ObjectId;
  content: string;
  mentions: string[];
  parentId?: Types.ObjectId;
  createdAt: Date;
}

export interface ITask extends Document {
  title: string;
  description?: string;
  status: 'Todo' | 'InProgress' | 'Done';
  assignees: Types.ObjectId[];
  createdBy: Types.ObjectId;
  comments: ITaskComment[];
  attachments: { url: string; name: string; uploadedBy: Types.ObjectId; uploadedAt: Date }[];
  viewingNow: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: { type: String, enum: ['Todo', 'InProgress', 'Done'], default: 'Todo' },
    assignees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    comments: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true },
        mentions: [String],
        parentId: { type: Schema.Types.ObjectId },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    attachments: [
      {
        url: String,
        name: String,
        uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    viewingNow: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export const Task = model<ITask>('Task', taskSchema);
