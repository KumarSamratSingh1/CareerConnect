import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Briefcase, Menu, X, ArrowRight, LogOut, User } from 'lucide-react';
import { useAuth } from '../../../context';
import { Button, Badge, ThemeToggle, useToast } from '../../ui';
import './Navbar.css';

/**
 * Responsive Top Navigation Bar with role-aware links and authentication state.
 */
export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const toast = useToast();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleSignOut = () => {
    closeMobileMenu();
    logout();
    toast.info('You have been signed out.');
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (user?.role === 'ADMIN') return '/admin/dashboard';
    if (user?.role === 'RECRUITER') return '/recruiter/dashboard';
    return '/candidate/dashboard';
  };

  return (
    <header className={`navbar ${isScrolled ? 'navbar--scrolled' : ''}`}>
      <div className="container navbar__container">
        {/* Brand Logo */}
        <Link to="/" className="navbar__brand" onClick={closeMobileMenu}>
          <div className="navbar__logo-icon">
            <Briefcase size={20} />
          </div>
          <span className="navbar__brand-text">
            Career<span className="navbar__brand-accent">Connect</span>
          </span>
        </Link>

        {/* Desktop Nav - Filtered by Role */}
        <nav className="navbar__nav">
          <NavLink
            to="/jobs"
            className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`}
          >
            Explore Jobs
          </NavLink>

          {isAuthenticated && user?.role === 'CANDIDATE' && (
            <>
              <NavLink
                to="/candidate/applications"
                className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`}
              >
                Applications
              </NavLink>
              <NavLink
                to="/candidate/dashboard"
                className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`}
              >
                Candidate Portal
              </NavLink>
            </>
          )}

          {isAuthenticated && user?.role === 'RECRUITER' && (
            <>
              <NavLink
                to="/recruiter/jobs"
                className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`}
              >
                Postings
              </NavLink>
              <NavLink
                to="/recruiter/dashboard"
                className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`}
              >
                Recruiter Hub
              </NavLink>
            </>
          )}

          {isAuthenticated && user?.role === 'ADMIN' && (
            <>
              <NavLink
                to="/admin/users"
                className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`}
              >
                Users
              </NavLink>
              <NavLink
                to="/admin/dashboard"
                className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`}
              >
                Admin Panel
              </NavLink>
            </>
          )}
        </nav>

        {/* Desktop Actions */}
        <div className="navbar__actions">
          <ThemeToggle />

          {isAuthenticated ? (
            <>
              <Link to={getDashboardPath()} className="navbar__user-profile" title="View Dashboard">
                <User size={15} className="text-brand" />
                <span className="navbar__user-email">{user?.email}</span>
                <Badge variant={user?.role === 'ADMIN' ? 'warning' : user?.role === 'RECRUITER' ? 'success' : 'primary'}>
                  {user?.role}
                </Badge>
              </Link>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                leftIcon={<LogOut size={14} />}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/login')}
              >
                Log In
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/register')}
                rightIcon={<ArrowRight size={14} />}
              >
                Get Started
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          type="button"
          className="navbar__mobile-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="navbar__mobile-menu">
          <div className="flex items-center justify-between px-3 py-2 mb-2 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Appearance</span>
            <ThemeToggle showLabel />
          </div>
          <NavLink
            to="/jobs"
            className={({ isActive }) => `navbar__mobile-link ${isActive ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            Explore Jobs
          </NavLink>

          {isAuthenticated ? (
            <>
              <NavLink
                to={getDashboardPath()}
                className={({ isActive }) => `navbar__mobile-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                {user?.role === 'ADMIN' ? 'Admin Panel' : user?.role === 'RECRUITER' ? 'Recruiter Hub' : 'Candidate Portal'}
              </NavLink>

              <div className="p-3 bg-slate-50 rounded-lg border border-subtle flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-brand" />
                  <span className="font-semibold text-slate-800 truncate max-w-[160px]">{user?.email}</span>
                </div>
                <Badge variant={user?.role === 'ADMIN' ? 'warning' : user?.role === 'RECRUITER' ? 'success' : 'primary'}>
                  {user?.role}
                </Badge>
              </div>

              <div className="navbar__mobile-actions">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={handleSignOut}
                  leftIcon={<LogOut size={16} />}
                >
                  Sign Out
                </Button>
              </div>
            </>
          ) : (
            <div className="navbar__mobile-actions">
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  closeMobileMenu();
                  navigate('/login');
                }}
              >
                Log In
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={() => {
                  closeMobileMenu();
                  navigate('/register');
                }}
              >
                Get Started
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
