import { useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  LayoutDashboard,
  User,
  FileText,
  Bookmark,
  Calendar,
  Building2,
  Users,
  X,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../../context';
import { Badge, useToast } from '../../ui';
import { cn } from '../../../utils/cn';
import './Sidebar.css';

const ROLE_CONFIGS = {
  candidate: {
    title: 'Candidate Portal',
    badgeVariant: 'primary',
    userRoleLabel: 'Candidate',
    links: [
      { to: '/candidate/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/candidate/profile', label: 'My Profile', icon: User },
      { to: '/candidate/resume', label: 'Resume Import', icon: Sparkles },
      { to: '/candidate/applications', label: 'Applications', icon: FileText },
      { to: '/candidate/saved-jobs', label: 'Saved Jobs', icon: Bookmark },
      { to: '/candidate/interviews', label: 'Interviews', icon: Calendar },
    ],
  },
  recruiter: {
    title: 'Recruiter Hub',
    badgeVariant: 'success',
    userRoleLabel: 'Recruiter',
    links: [
      { to: '/recruiter/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/recruiter/jobs', label: 'Job Postings', icon: Briefcase },
      { to: '/recruiter/applications', label: 'Applications', icon: FileText },
      { to: '/recruiter/interviews', label: 'Interviews', icon: Calendar },
      { to: '/recruiter/company', label: 'Company Profile', icon: Building2 },
      { to: '/recruiter/profile', label: 'My Profile', icon: User },
    ],
  },
  admin: {
    title: 'Admin Control Center',
    badgeVariant: 'warning',
    userRoleLabel: 'System Admin',
    links: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/admin/users', label: 'User Management', icon: Users },
      { to: '/admin/companies', label: 'Companies', icon: Building2 },
      { to: '/admin/jobs', label: 'Job Postings', icon: Briefcase },
      { to: '/admin/applications', label: 'Applications', icon: FileText },
      { to: '/admin/interviews', label: 'Interviews', icon: Calendar },
    ],
  },
};

/**
 * Reusable Sidebar component supporting Candidate, Recruiter, and Admin menus.
 */
export const Sidebar = ({
  role = 'candidate',
  isOpen = false,
  onClose,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const toast = useToast();
  const config = ROLE_CONFIGS[role] || ROLE_CONFIGS.candidate;

  // ESC key listener for mobile sidebar drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSignOut = (e) => {
    e.preventDefault();
    if (onClose) onClose();
    logout();
    toast.info('You have been signed out.');
    navigate('/login');
  };

  const displayName = user?.email ? user.email.split('@')[0] : `Demo ${config.userRoleLabel}`;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={cn('sidebar', isOpen && 'sidebar--open')}>
        {/* Top Header */}
        <div className="sidebar__header">
          <Link to="/" className="sidebar__brand" onClick={onClose}>
            <div className="sidebar__brand-icon">
              <Briefcase size={16} />
            </div>
            <span>CareerConnect</span>
          </Link>
          <button
            type="button"
            className="sidebar__close-btn"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Role identifier badge */}
        <div className="sidebar__role-tag">
          <Badge variant={config.badgeVariant} hasDot>
            {config.title}
          </Badge>
        </div>

        {/* Dynamic Navigation Links */}
        <nav className="sidebar__nav">
          {config.links.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn('sidebar__link', isActive && 'active')
                }
                onClick={onClose}
              >
                <span className="sidebar__link-icon">
                  <Icon size={18} />
                </span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Info Teaser & Sign Out */}
        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar">
              {role.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar__user-info">
              <span className="sidebar__user-name" title={user?.email || displayName}>
                {displayName}
              </span>
              <span className="sidebar__user-role">{config.userRoleLabel}</span>
            </div>
          </div>
          <button
            type="button"
            className="sidebar__close-btn"
            onClick={handleSignOut}
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
