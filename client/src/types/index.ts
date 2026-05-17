export type UserRole = 'President' | 'Secretary' | 'Officer' | 'Committee' | 'Attendance';

export interface User {
  _id: string;
  studentId: string;
  name: { first: string; last: string };
  email: string;
  role: UserRole;
  avatarUrl?: string;
  avatarColor?: number;
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

export type ReportStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected';

export interface ReportAttachment {
  id: string;
  url: string;
  caption?: string;
  sort_order?: number;
  file_type: 'image' | 'pdf' | 'document';
}

export interface Report {
  id: string;
  /** legacy mongo compat */
  _id?: string;
  event_id: string;
  activity_id?: string;
  author_id: string;
  profiles?: { id: string; first_name: string; last_name: string; role: string };
  type: 'Update' | 'Emergency' | 'Accomplishment';
  title: string;
  content: string;
  status: ReportStatus;
  rejection_note?: string;
  approved_by?: string;
  approved_at?: string;
  report_attachments?: ReportAttachment[];
  is_resolved?: boolean;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

export interface AccomplishmentExport {
  id: string;
  event_id: string;
  exported_by: string;
  profiles?: { first_name: string; last_name: string };
  is_final: boolean;
  section_order: string[];
  created_at: string;
}

export interface Sprint {
  _id: string;
  name: string;
  goal?: string;
  status: 'Active' | 'Completed' | 'Planning';
  startDate?: string;
  endDate?: string;
  createdBy: string;
  createdAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'Todo' | 'InProgress' | 'Done';
  sprint_id: string;
  assignees: Pick<User, '_id' | 'name' | 'role'>[];
  visible_to: UserRole[];
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
