import { CheckCircle2, Circle, Clock } from 'lucide-react';
import type { UserRole, Sprint } from '@/types';

export const COLUMNS = [
  { id: 'Todo' as const,       label: 'To Do',       icon: Circle,       color: 'red'   },
  { id: 'InProgress' as const, label: 'In Progress', icon: Clock,        color: 'blue'  },
  { id: 'Done' as const,       label: 'Done',        icon: CheckCircle2, color: 'green' },
];

export const ALL_ROLES: UserRole[] = ['President', 'Secretary', 'Officer', 'Committee', 'Attendance'];

export const ROLE_COLORS: Record<UserRole, string> = {
  President:  'bg-brand-100 text-brand-700 border-brand-200',
  Secretary:  'bg-blue-100 text-blue-700 border-blue-200',
  Officer:    'bg-amber-100 text-amber-700 border-amber-200',
  Committee:  'bg-slate-100 text-slate-600 border-slate-200',
  Attendance: 'bg-green-100 text-green-700 border-green-200',
};

export const STATUS_COLORS: Record<Sprint['status'], string> = {
  Planning:  'bg-slate-100 text-slate-600',
  Active:    'bg-green-100 text-green-700',
  Completed: 'bg-blue-100 text-blue-700',
};
