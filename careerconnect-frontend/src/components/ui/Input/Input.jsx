import { forwardRef } from 'react';
import { cn } from '../../../utils/cn';
import './Input.css';

/**
 * Reusable Input component with labels, error states, and icon slots.
 */
export const Input = forwardRef(({
  label,
  error,
  helperText,
  required = false,
  leftIcon,
  rightIcon,
  className = '',
  id,
  type = 'text',
  disabled = false,
  ...props
}, ref) => {
  const generatedId = id || (label ? `input-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : undefined);
  const errorId = generatedId ? `${generatedId}-error` : undefined;
  const helperId = generatedId ? `${generatedId}-helper` : undefined;

  return (
    <div className={cn('input-wrapper', error && 'input-wrapper--error', className)}>
      {label && (
        <label htmlFor={generatedId} className="input-label">
          {label}
          {required && <span className="input-label__required" aria-hidden="true">*</span>}
        </label>
      )}
      <div className={cn(
        'input-container',
        leftIcon && 'input-container--has-left-icon',
        rightIcon && 'input-container--has-right-icon'
      )}>
        {leftIcon && <span className="input-icon input-icon--left" aria-hidden="true">{leftIcon}</span>}
        <input
          ref={ref}
          id={generatedId}
          type={type}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className="input-field"
          {...props}
        />
        {rightIcon && <span className="input-icon input-icon--right">{rightIcon}</span>}
      </div>
      {error && <span id={errorId} className="input-error" role="alert">{error}</span>}
      {!error && helperText && <span id={helperId} className="input-helper">{helperText}</span>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
