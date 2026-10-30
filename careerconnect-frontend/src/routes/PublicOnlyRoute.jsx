import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

/**
 * Route guard redirecting authenticated users away from public auth pages (/login, /register)
 * to their respective role dashboard.
 */
export const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen center text="Loading..." />;
  }

  if (isAuthenticated && user) {
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.role === 'RECRUITER') {
      return <Navigate to="/recruiter/dashboard" replace />;
    }
    return <Navigate to="/candidate/dashboard" replace />;
  }

  return children ? children : <Outlet />;
};

export default PublicOnlyRoute;
