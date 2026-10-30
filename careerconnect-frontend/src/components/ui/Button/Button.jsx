import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../../utils/cn';
import './Button.css';

/**
 * Reusable Button component with multiple variants, sizes, and loading state.
 */
export const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = '',
  type = 'button',
  ...props
}, ref) => {
  const isButtonDisabled = disabled || isLoading;
  const normalizedVariant = variant === 'error' ? 'danger' : variant;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isButtonDisabled}
      aria-busy={isLoading ? 'true' : undefined}
      className={cn(
        'btn',
        `btn--${normalizedVariant}`,
        `btn--${size}`,
        fullWidth && 'btn--full-width',
        isLoading && 'btn--loading',
        isButtonDisabled && 'btn--disabled',
        className
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="btn__spinner" size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
          <span>{children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="btn__icon btn__icon--left">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="btn__icon btn__icon--right">{rightIcon}</span>}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
