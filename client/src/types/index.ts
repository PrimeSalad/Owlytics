export type UserRole = 'President' | 'Secretary' | 'Officer' | 'Committee' | 'Attendance';

export interface User {
  _id: string;
  studentId: string;
  name: { first: string; last: string };
  email: string;
  role: UserRole;
  avatarUrl?: string;
  assignedSection?: string | null;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface Student {
  _id: string;
  studentId: string;
  name: { first: string; last: string };
  email: string;
  section: string;
  yearLevel: number;
  qrCodeUrl?: string;
  createdAt: string;
}

export interface Event {
  _id: string;
  title: string;
  description?: string;
  venue?: string;
  dateRange: { start: string; end: string };
  status: 'Planning' | 'Ongoing' | 'Completed' | 'Cancelled';
  createdBy: Pick<User, '_id' | 'name' | 'role'>;
  assignedOfficers: Pick<User, '_id' | 'name' | 'role'>[];
  activities: Activity[];
  createdAt: string;
}

export interface Activity {
  _id: string;
  name: string;
  description?: string;
  startTime: string;
  endTime: string;
  committeeId?: string;
  status: 'Pending' | 'InProgress' | 'Done';
  updates: ActivityUpdate[];
}

export interface ActivityUpdate {
  content: string;
  attachments: string[];
  submittedBy: string;
  submittedAt: string;
}

export interface AttendanceRecord {
  _id: string;
  eventId: string;
  scheduleId: string;
  sessionId: string;
  studentId: Pick<Student, '_id' | 'name' | 'studentId'>;
  status: 'Present' | 'Late' | 'Absent';
  scannedBy?: Pick<User, '_id' | 'name'>;
  timestamp: string;
}

export interface Report {
  _id: string;
  eventId: string;
  activityId?: string;
  authorId: Pick<User, '_id' | 'name' | 'role'>;
  type: 'Update' | 'Emergency' | 'Accomplishment';
  title: string;
  content: string;
  attachments: { url: string; publicId: string; fileType: 'image' | 'pdf' | 'document' }[];
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'Todo' | 'InProgress' | 'Done';
  assignees: Pick<User, '_id' | 'name' | 'role'>[];
  visible_to: UserRole[]; // roles that can see this task (President/Secretary always see all)
  createdBy: Pick<User, '_id' | 'name' | 'role'>;
  comments: TaskComment[];
  attachments: { url: string; name: string; uploadedBy: string; uploadedAt: string }[];
  viewingNow: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskComment {
  _id: string;
  userId: Pick<User, '_id' | 'name' | 'role'>;
  content: string;
  mentions: string[]; // role names or user IDs
  parentId?: string; // for threaded replies
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
