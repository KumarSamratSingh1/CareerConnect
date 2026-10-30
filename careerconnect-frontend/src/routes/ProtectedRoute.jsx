import { useLocation, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';

/**
 * Route guard ensuring authentication and role-based authorization.
 * @param {string} allowedRole - 'CANDIDATE' | 'RECRUITER' | 'ADMIN'
 */
export const ProtectedRoute = ({ allowedRole }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner fullScreen center text="Authenticating session..." />;
  }

  if (!isAuthenticated) {
    // Redirect unauthenticated users to /login preserving intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRole && user?.role !== allowedRole) {
    // User is logged in but lacks the required role
    return <UnauthorizedPage requiredRole={allowedRole} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
