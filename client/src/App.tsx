import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import LoginPage from '@/pages/LoginPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { EventsPage } from '@/pages/EventsPage';
import { AttendancePage } from '@/pages/AttendancePage';
import { AttendanceSummaryPage } from '@/pages/AttendanceSummaryPage';
import { ScannerPage } from '@/pages/ScannerPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { MembersPage } from '@/pages/MembersPage';
import { StudentsPage } from '@/pages/StudentsPage';
import { TasksPage } from '@/pages/TasksPage';
import { TodoPage } from '@/pages/TodoPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AboutPage } from '@/pages/AboutPage';
import LogsPage from '@/pages/LogsPage';


export default function App() {
  const fetchMe = useAuthStore((state) => state.fetchMe);

  useEffect(() => {
    fetchMe();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected — all authenticated users */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/todo" element={<TodoPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/about" element={<AboutPage />} />

            {/* People — account access management */}
            <Route element={<ProtectedRoute roles={['President', 'Secretary']} />}>
              <Route path="/people" element={<MembersPage />} />
              <Route path="/members" element={<Navigate to="/people" replace />} />
            </Route>

            {/* Student Directory — student records */}
            <Route element={<ProtectedRoute roles={['President', 'Secretary', 'Officer']} />}>
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/directory" element={<Navigate to="/students" replace />} />
              <Route path="/tasks" element={<TasksPage />} />
            </Route>

            {/* Secretary + President */}
            <Route element={<ProtectedRoute roles={['President', 'Secretary', 'Attendance']} />}>
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/attendance/summary" element={<AttendanceSummaryPage />} />
            </Route>

            {/* Attendance role only */}
            <Route element={<ProtectedRoute roles={['Attendance']} />}>
              <Route path="/scanner" element={<ScannerPage />} />
            </Route>

            {/* President only */}
            <Route element={<ProtectedRoute roles={['President']} />}>
              <Route path="/logs" element={<LogsPage />} />
            </Route>
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
