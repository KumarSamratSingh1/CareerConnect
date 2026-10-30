import { FolderOpen } from 'lucide-react';
import { cn } from '../../../utils/cn';
import './EmptyState.css';

/**
 * Reusable EmptyState component when tables or lists have zero items.
 */
export const EmptyState = ({
  icon,
  title = 'No records found',
  description = 'There are currently no items to display here.',
  action,
  className = '',
}) => {
  return (
    <div className={cn('empty-state', className)}>
      <div className="empty-state__icon-wrapper">
        {icon || <FolderOpen size={32} />}
      </div>
      <h3 className="empty-state__title">{title}</h3>
      {description && <p className="empty-state__description">{description}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
};

export default EmptyState;
