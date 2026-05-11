import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { EventsPage } from '@/pages/EventsPage';
import { AttendancePage } from '@/pages/AttendancePage';
import { ScannerPage } from '@/pages/ScannerPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { DirectoryPage } from '@/pages/DirectoryPage';


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

            {/* Combined Directory — Accessible by President, Secretary, Officer */}
            <Route element={<ProtectedRoute roles={['President', 'Secretary', 'Officer']} />}>
              <Route path="/directory" element={<DirectoryPage />} />
              {/* Redirect old paths */}
              <Route path="/students" element={<Navigate to="/directory" replace />} />
              <Route path="/members" element={<Navigate to="/directory" replace />} />
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

