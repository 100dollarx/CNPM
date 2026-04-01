import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import MainLayout from './layouts/MainLayout'
import DashboardPage from './pages/DashboardPage'
import TournamentsPage from './pages/TournamentsPage'
import TeamsPage from './pages/TeamsPage'
import MatchesPage from './pages/MatchesPage'
import DisputesPage from './pages/DisputesPage'
import NotificationsPage from './pages/NotificationsPage'
import UsersPage from './pages/UsersPage'
import AuditLogPage from './pages/AuditLogPage'

export default function App() {
  return (
    <ThemeProvider>
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
    </ThemeProvider>
  )
}
