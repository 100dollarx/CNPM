import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import MainLayout from './layouts/MainLayout'
import DashboardPage from './pages/DashboardPage'
import { TournamentsPage, TeamsPage, MatchesPage, DisputesPage, NotificationsPage, UsersPage, AuditLogPage } from './pages/PlaceholderPages'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard"     element={<DashboardPage />} />
              <Route path="/tournaments"   element={<TournamentsPage />} />
              <Route path="/teams"         element={<TeamsPage />} />
              <Route path="/matches"       element={<MatchesPage />} />
              <Route path="/disputes"      element={<DisputesPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/users"         element={<UsersPage />} />
              <Route path="/audit-log"     element={<AuditLogPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
