import { cn } from '../../../utils/cn';
import './LoadingSpinner.css';

/**
 * Reusable animated SVG LoadingSpinner with size options and overlay layouts.
 */
export const LoadingSpinner = ({
  size = 'md',
  variant = 'primary',
  text,
  message,
  center = false,
  fullScreen = false,
  className = '',
}) => {
  const displayText = text || message;

  const spinnerElement = (
    <svg
      className={cn('spinner-svg', `spinner--${size}`, `spinner--${variant}`)}
      viewBox="0 0 50 50"
      aria-hidden="true"
    >
      <circle
        className="spinner-circle"
        cx="25"
        cy="25"
        r="20"
        fill="none"
        strokeWidth="4"
      />
    </svg>
  );

  if (center || fullScreen || displayText) {
    return (
      <div
        className={cn(
          'spinner-container',
          center && 'spinner-container--center',
          fullScreen && 'spinner-container--fullscreen',
          className
        )}
        role="status"
        aria-live="polite"
      >
        {spinnerElement}
        {displayText && <span className="spinner-text">{displayText}</span>}
        <span className="sr-only">{displayText || 'Loading...'}</span>
      </div>
    );
  }

  return (
    <div className={cn('spinner-container', className)} role="status" aria-live="polite">
      {spinnerElement}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;
