import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

// Route Guards
import { ProtectedRoute } from './ProtectedRoute';
import { PublicOnlyRoute } from './PublicOnlyRoute';

// Public Pages
const HomePage = lazy(() => import('../pages/public/HomePage'));
const JobsPage = lazy(() => import('../pages/public/JobsPage'));
const JobDetailsPage = lazy(() => import('../pages/public/JobDetailsPage'));
const LoginPage = lazy(() => import('../pages/public/LoginPage'));
const RegisterPage = lazy(() => import('../pages/public/RegisterPage'));
import UnauthorizedPage from '../pages/UnauthorizedPage';

// Candidate Pages
const CandidateDashboardPage = lazy(() => import('../pages/candidate/CandidateDashboardPage'));
const CandidateProfilePage = lazy(() => import('../pages/candidate/CandidateProfilePage'));
const CandidateApplicationsPage = lazy(() => import('../pages/candidate/CandidateApplicationsPage'));
const CandidateSavedJobsPage = lazy(() => import('../pages/candidate/CandidateSavedJobsPage'));
const CandidateInterviewsPage = lazy(() => import('../pages/candidate/CandidateInterviewsPage'));
const ResumeImportPage = lazy(() => import('../pages/candidate/ResumeImportPage'));

// Recruiter Pages
const RecruiterDashboardPage = lazy(() => import('../pages/recruiter/RecruiterDashboardPage'));
const RecruiterCompanyPage = lazy(() => import('../pages/recruiter/RecruiterCompanyPage'));
const RecruiterJobsPage = lazy(() => import('../pages/recruiter/RecruiterJobsPage'));
const RecruiterApplicationsPage = lazy(() => import('../pages/recruiter/RecruiterApplicationsPage'));
const RecruiterInterviewsPage = lazy(() => import('../pages/recruiter/RecruiterInterviewsPage'));
const RecruiterProfilePage = lazy(() => import('../pages/recruiter/RecruiterProfilePage'));

// Admin Pages
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('../pages/admin/AdminUsersPage'));
const AdminCompaniesPage = lazy(() => import('../pages/admin/AdminCompaniesPage'));
const AdminJobsPage = lazy(() => import('../pages/admin/AdminJobsPage'));
const AdminApplicationsPage = lazy(() => import('../pages/admin/AdminApplicationsPage'));
const AdminInterviewsPage = lazy(() => import('../pages/admin/AdminInterviewsPage'));

// 404 Page
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

const PageFallback = () => (
  <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
    <LoadingSpinner center text="Loading CareerConnect..." />
  </div>
);

/**
 * AppRoutes defining all application route hierarchies with authentication and role guards.
 * Uses React Suspense and dynamic imports for optimal bundle size and sub-second page loads.
 */
export const AppRoutes = () => {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/jobs/:jobId" element={<JobDetailsPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Auth Public-Only Routes (redirects authenticated users to their dashboard) */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />

        {/* Protected Candidate Portal Routes (Only CANDIDATE) */}
        <Route path="/candidate" element={<ProtectedRoute allowedRole="CANDIDATE" />}>
          <Route index element={<Navigate to="/candidate/dashboard" replace />} />
          <Route path="dashboard" element={<CandidateDashboardPage />} />
          <Route path="profile" element={<CandidateProfilePage />} />
          <Route path="applications" element={<CandidateApplicationsPage />} />
          <Route path="saved-jobs" element={<CandidateSavedJobsPage />} />
          <Route path="interviews" element={<CandidateInterviewsPage />} />
          <Route path="resume" element={<ResumeImportPage />} />
        </Route>

        {/* Protected Recruiter Hub Routes (Only RECRUITER) */}
        <Route path="/recruiter" element={<ProtectedRoute allowedRole="RECRUITER" />}>
          <Route index element={<Navigate to="/recruiter/dashboard" replace />} />
          <Route path="dashboard" element={<RecruiterDashboardPage />} />
          <Route path="profile" element={<RecruiterProfilePage />} />
          <Route path="company" element={<RecruiterCompanyPage />} />
          <Route path="jobs" element={<RecruiterJobsPage />} />
          <Route path="applications" element={<RecruiterApplicationsPage />} />
          <Route path="interviews" element={<RecruiterInterviewsPage />} />
        </Route>

        {/* Protected Admin Control Center Routes (Only ADMIN) */}
        <Route path="/admin" element={<ProtectedRoute allowedRole="ADMIN" />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="companies" element={<AdminCompaniesPage />} />
          <Route path="jobs" element={<AdminJobsPage />} />
          <Route path="applications" element={<AdminApplicationsPage />} />
          <Route path="interviews" element={<AdminInterviewsPage />} />
        </Route>

        {/* Catch-all 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
