import { cn } from '../../../utils/cn';
import './Badge.css';

const STATUS_LABELS = {
  // Application statuses
  APPLIED: 'Applied',
  UNDER_REVIEW: 'Under Review',
  SHORTLISTED: 'Shortlisted',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  SELECTED: 'Selected',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',

  // Interview statuses
  SCHEDULED: 'Scheduled',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',

  // Job statuses
  OPEN: 'Open',
  CLOSED: 'Closed',

  // Company statuses
  VERIFIED: 'Verified',
  UNVERIFIED: 'Unverified',
  PENDING: 'Pending',

  // User account statuses
  ENABLED: 'Enabled',
  DISABLED: 'Disabled',
};

/**
 * Reusable Badge component supporting standard semantic colors and
 * CareerConnect business status presets with accessible dot/icon indicators.
 */
export const Badge = ({
  children,
  variant,
  status,
  hasDot,
  className = '',
  ...props
}) => {
  let badgeClass = 'badge--neutral';
  let content = children;
  // Default to showing an indicator dot for business status badges
  const showDot = hasDot !== undefined ? hasDot : Boolean(status);

  if (status) {
    const normalizedStatus = status.toUpperCase();
    badgeClass = `badge--status-${normalizedStatus.toLowerCase()}`;
    if (!content && STATUS_LABELS[normalizedStatus]) {
      content = STATUS_LABELS[normalizedStatus];
    }
  } else if (variant) {
    badgeClass = `badge--${variant}`;
  }

  return (
    <span className={cn('badge', badgeClass, className)} {...props}>
      {showDot && <span className="badge--dot" aria-hidden="true" />}
      <span>{content || status}</span>
    </span>
  );
};

export default Badge;
