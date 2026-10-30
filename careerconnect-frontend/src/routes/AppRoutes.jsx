import { Routes, Route, Navigate } from 'react-router-dom';

// Route Guards
import { ProtectedRoute } from './ProtectedRoute';
import { PublicOnlyRoute } from './PublicOnlyRoute';

// Public Pages
import HomePage from '../pages/public/HomePage';
import JobsPage from '../pages/public/JobsPage';
import JobDetailsPage from '../pages/public/JobDetailsPage';
import LoginPage from '../pages/public/LoginPage';
import RegisterPage from '../pages/public/RegisterPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';

// Candidate Pages
import CandidateDashboardPage from '../pages/candidate/CandidateDashboardPage';
import CandidateProfilePage from '../pages/candidate/CandidateProfilePage';
import CandidateApplicationsPage from '../pages/candidate/CandidateApplicationsPage';
import CandidateSavedJobsPage from '../pages/candidate/CandidateSavedJobsPage';
import CandidateInterviewsPage from '../pages/candidate/CandidateInterviewsPage';
import ResumeImportPage from '../pages/candidate/ResumeImportPage';

// Recruiter Pages
import RecruiterDashboardPage from '../pages/recruiter/RecruiterDashboardPage';
import RecruiterCompanyPage from '../pages/recruiter/RecruiterCompanyPage';
import RecruiterJobsPage from '../pages/recruiter/RecruiterJobsPage';
import RecruiterApplicationsPage from '../pages/recruiter/RecruiterApplicationsPage';
import RecruiterInterviewsPage from '../pages/recruiter/RecruiterInterviewsPage';
import RecruiterProfilePage from '../pages/recruiter/RecruiterProfilePage';

// Admin Pages
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminCompaniesPage from '../pages/admin/AdminCompaniesPage';
import AdminJobsPage from '../pages/admin/AdminJobsPage';
import AdminApplicationsPage from '../pages/admin/AdminApplicationsPage';
import AdminInterviewsPage from '../pages/admin/AdminInterviewsPage';

// 404 Page
import NotFoundPage from '../pages/NotFoundPage';

/**
 * AppRoutes defining all application route hierarchies with authentication and role guards.
 */
export const AppRoutes = () => {
  return (
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
  );
};

export default AppRoutes;
