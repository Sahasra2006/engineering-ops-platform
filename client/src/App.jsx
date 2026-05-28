import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from './pages/Login'
import { SignupPage } from './pages/Signup'
import { DashboardPage } from './pages/Dashboard'
import { TeamsPage } from './pages/Teams'
import { ProjectsPage } from './pages/Projects'
import { TasksPage } from './pages/Tasks'
import { BugsPage } from './pages/Bugs'
import { IncidentsPage } from './pages/Incidents'
import { ProfilePage } from './pages/Profile'
import { AppLayout } from './layouts/AppLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ROLES } from './utils/rbac'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route
          path="/teams"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.DEVELOPER, ROLES.QA]}>
              <TeamsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
              <ProjectsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/bugs" element={<BugsPage />} />
        <Route path="/incidents" element={<IncidentsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
