import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { EventsPage } from '@/pages/EventsPage';
import { AttendancePage } from '@/pages/AttendancePage';
import { ScannerPage } from '@/pages/ScannerPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { MembersPage } from '@/pages/MembersPage';
import { StudentsPage } from '@/pages/StudentsPage';


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected — all authenticated users */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/reports" element={<ReportsPage />} />

            {/* People — account access management */}
            <Route element={<ProtectedRoute roles={['President', 'Secretary']} />}>
              <Route path="/people" element={<MembersPage />} />
              <Route path="/members" element={<Navigate to="/people" replace />} />
            </Route>

            {/* Student Directory — student records */}
            <Route element={<ProtectedRoute roles={['President', 'Secretary', 'Officer']} />}>
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/directory" element={<Navigate to="/students" replace />} />
            </Route>

            {/* Secretary + President */}
            <Route element={<ProtectedRoute roles={['President', 'Secretary', 'Attendance']} />}>
              <Route path="/attendance" element={<AttendancePage />} />
            </Route>

            {/* Attendance role only */}
            <Route element={<ProtectedRoute roles={['Attendance']} />}>
              <Route path="/scanner" element={<ScannerPage />} />
            </Route>
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
