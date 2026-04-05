import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { LangProvider } from './contexts/LangContext'
import { ToastProvider } from './contexts/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import MainLayout from './layouts/MainLayout'
import DashboardPage from './pages/DashboardPage'
import TournamentsPage from './pages/TournamentsPage'
import TeamsPage from './pages/TeamsPage'
import MatchesPage from './pages/MatchesPage'
import DisputesPage from './pages/DisputesPage'
import NotificationsPage from './pages/NotificationsPage'
import UsersPage from './pages/UsersPage'
import AuditLogPage from './pages/AuditLogPage'
// New pages migrated from UI/pages
import BracketViewPage from './pages/BracketViewPage'
import LeaderboardPage from './pages/LeaderboardPage'
import CheckInPage from './pages/CheckInPage'
import MapVetoPage from './pages/MapVetoPage'
import ResultSubmitPage from './pages/ResultSubmitPage'
import SideSelectPage from './pages/SideSelectPage'
import BRScoringPage from './pages/BRScoringPage'
import RegisterPage from './pages/RegisterPage'
import ActivatePage from './pages/ActivatePage'
import ProfilePage from './pages/ProfilePage'

export default function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
            <Routes>
              <Route path="/login"    element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/activate" element={<ActivatePage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  {/* Core pages */}
                  <Route path="/dashboard"     element={<DashboardPage />} />
                  <Route path="/tournaments"   element={<TournamentsPage />} />
                  <Route path="/teams"         element={<TeamsPage />} />
                  <Route path="/matches"       element={<MatchesPage />} />
                  <Route path="/disputes"      element={<DisputesPage />} />
                  <Route path="/profile"       element={<ProfilePage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />

                  {/* Admin pages */}
                  <Route path="/users"         element={<UsersPage />} />
                  <Route path="/audit-log"     element={<AuditLogPage />} />

                  {/* Tournament sub-pages */}
                  <Route path="/tournaments/:id/bracket"     element={<BracketViewPage />} />
                  <Route path="/tournaments/:id/leaderboard" element={<LeaderboardPage />} />

                  {/* Match sub-pages */}
                  <Route path="/matches/:id/check-in"       element={<CheckInPage />} />
                  <Route path="/matches/:id/map-veto"        element={<MapVetoPage />} />
                  <Route path="/matches/:id/result"          element={<ResultSubmitPage />} />
                  <Route path="/matches/:id/side-select"     element={<SideSelectPage />} />

                  {/* BR Scoring */}
                  <Route path="/br-scoring"                  element={<BRScoringPage />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </LangProvider>
    </ThemeProvider>
  )
}
