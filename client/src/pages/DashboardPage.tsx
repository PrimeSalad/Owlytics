import { useAuthStore } from '@/store/authStore';
import { PresidentDashboard } from '@/features/dashboard/PresidentDashboard';
import { SecretaryDashboard } from '@/features/dashboard/SecretaryDashboard';
import { OfficerDashboard } from '@/features/dashboard/OfficerDashboard';
import { CommitteeDashboard } from '@/features/dashboard/CommitteeDashboard';
import { AttendanceDashboard } from '@/features/dashboard/AttendanceDashboard';

export function DashboardPage() {
  const { user } = useAuthStore();

  switch (user?.role) {
    case 'President':  return <PresidentDashboard />;
    case 'Secretary':  return <SecretaryDashboard />;
    case 'Officer':    return <OfficerDashboard />;
    case 'Committee':  return <CommitteeDashboard />;
    case 'Attendance': return <AttendanceDashboard />;
    default:           return null;
  }
}
