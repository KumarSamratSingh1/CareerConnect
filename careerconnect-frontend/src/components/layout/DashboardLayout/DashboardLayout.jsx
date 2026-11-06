import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Menu, User, LogOut } from 'lucide-react';
import { Sidebar } from '../Sidebar';
import { Button, Badge, ThemeToggle, useToast } from '../../ui';
import { useAuth } from '../../../context';
import './DashboardLayout.css';

/**
 * Reusable DashboardLayout Shell for Candidate, Recruiter, and Admin dashboards.
 */
export const DashboardLayout = ({
  role = 'candidate',
  title = 'Dashboard',
  breadcrumb,
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const toast = useToast();

  const handleSignOut = () => {
    logout();
    toast.info('You have been signed out.');
    navigate('/login');
  };

  return (
    <div className="dashboard-layout">
      {/* Dynamic Sidebar */}
      <Sidebar
        role={role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Panel */}
      <div className="dashboard-main">
        {/* Top Header */}
        <header className="dashboard-header">
          <div className="dashboard-header__left">
            <button
              type="button"
              className="dashboard-header__toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={22} />
            </button>
            <div className="dashboard-header__title-group">
              {breadcrumb && (
                <span className="dashboard-header__breadcrumb">{breadcrumb}</span>
              )}
              <h1 className="dashboard-header__title">{title}</h1>
            </div>
          </div>

          <div className="dashboard-header__right">
            <ThemeToggle />
            {user ? (
              <div className="flex items-center gap-2">
                <div className="dashboard-header__user-pill">
                  <div className="dashboard-header__user-avatar" aria-hidden="true">
                    {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="dashboard-header__user-meta">
                    <span className="dashboard-header__user-email" title={user.email}>
                      {user.email}
                    </span>
                    <Badge
                      variant={user.role === 'ADMIN' ? 'warning' : user.role === 'RECRUITER' ? 'success' : 'primary'}
                    >
                      {user.role || role.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  title="Sign Out"
                  aria-label="Sign Out"
                  className="dashboard-header__logout-btn"
                >
                  <LogOut size={16} />
                </Button>
              </div>
            ) : (
              <Link to="/login">
                <Button variant="ghost" size="sm" leftIcon={<User size={16} />}>
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </header>

        {/* Scrollable Content View */}
        <main className="dashboard-content">
          <div className="dashboard-content__inner">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
