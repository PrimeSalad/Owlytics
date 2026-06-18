import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { PageSpinner } from '@/components/ui';
import { roleSatisfies } from '@/lib/utils';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  roles?: UserRole[];
}

export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuthStore();

  if (isLoading) return <PageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roleSatisfies(user.role, roles)) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
