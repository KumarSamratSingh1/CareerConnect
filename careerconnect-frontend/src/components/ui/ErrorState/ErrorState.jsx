import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../Button';
import { cn } from '../../../utils/cn';
import './ErrorState.css';

/**
 * Reusable ErrorState component for handling failed data queries with retry action.
 */
export const ErrorState = ({
  icon,
  title = 'Something went wrong',
  message = 'We encountered an error while loading this data. Please try again.',
  onRetry,
  retryLabel = 'Try Again',
  className = '',
}) => {
  return (
    <div className={cn('error-state', className)}>
      <div className="error-state__icon-wrapper">
        {icon || <AlertCircle size={32} />}
      </div>
      <h3 className="error-state__title">{title}</h3>
      {message && <p className="error-state__message">{message}</p>}
      {onRetry && (
        <div className="error-state__action">
          <Button
            variant="outline"
            onClick={onRetry}
            leftIcon={<RefreshCw size={16} />}
          >
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ErrorState;
