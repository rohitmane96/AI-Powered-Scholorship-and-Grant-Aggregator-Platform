import React, { Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { UserRole } from '@/types'
import { PageSpinner } from '@/components/ui/Spinner'

// Layouts
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { PublicLayout } from '@/components/layout/PublicLayout'

// Public pages
import Landing from '@/pages/Landing'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'

// Student pages
import StudentDashboard from '@/pages/student/Dashboard'
import Scholarships from '@/pages/student/Scholarships'
import ScholarshipDetail from '@/pages/student/ScholarshipDetail'
import Applications from '@/pages/student/Applications'
import Documents from '@/pages/student/Documents'
import Notifications from '@/pages/student/Notifications'
import Recommendations from '@/pages/student/Recommendations'

// Profile
import Profile from '@/pages/profile/Profile'

// Institution pages
import InstitutionDashboard from '@/pages/institution/InstitutionDashboard'
import ManageScholarships from '@/pages/institution/ManageScholarships'
import ViewApplications from '@/pages/institution/ViewApplications'

// Admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard'

// ============================================================
// Route guards
// ============================================================

interface ProtectedRouteProps {
  children: React.ReactNode
  roles?: UserRole[]
}

function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && user && !roles.includes(user.role)) {
    // Redirect to appropriate dashboard
    if (user.role === UserRole.ADMIN) return <Navigate to="/admin/dashboard" replace />
    if (user.role === UserRole.INSTITUTION) return <Navigate to="/institution/dashboard" replace />
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()

  if (isAuthenticated && user) {
    if (user.role === UserRole.ADMIN) return <Navigate to="/admin/dashboard" replace />
    if (user.role === UserRole.INSTITUTION) return <Navigate to="/institution/dashboard" replace />
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

// ============================================================
// Main App
// ============================================================

export default function App() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />

        <Route element={<PublicLayout />}>
          <Route
            path="/login"
            element={<PublicOnlyRoute><Login /></PublicOnlyRoute>}
          />
          <Route
            path="/register"
            element={<PublicOnlyRoute><Register /></PublicOnlyRoute>}
          />
        </Route>

        {/* Student routes */}
        <Route
          element={
            <ProtectedRoute roles={[UserRole.STUDENT]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/scholarships" element={<Scholarships />} />
          <Route path="/scholarships/:id" element={<ScholarshipDetail />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Institution routes */}
        <Route
          element={
            <ProtectedRoute roles={[UserRole.INSTITUTION]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/institution/dashboard" element={<InstitutionDashboard />} />
          <Route path="/institution/scholarships" element={<ManageScholarships />} />
          <Route path="/institution/applications" element={<ViewApplications />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Admin routes */}
        <Route
          element={
            <ProtectedRoute roles={[UserRole.ADMIN]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminDashboard />} />
          <Route path="/admin/scholarships" element={<Scholarships />} />
          <Route path="/admin/applications" element={<Applications />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
