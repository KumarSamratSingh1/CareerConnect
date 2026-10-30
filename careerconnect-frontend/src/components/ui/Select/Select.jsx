import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../../utils/cn';
import './Select.css';

/**
 * Reusable Select component with custom styling, label, and error state.
 */
export const Select = forwardRef(({
  label,
  error,
  helperText,
  required = false,
  options = [],
  children,
  placeholder,
  className = '',
  id,
  disabled = false,
  ...props
}, ref) => {
  const generatedId = id || (label ? `select-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : undefined);
  const errorId = generatedId ? `${generatedId}-error` : undefined;
  const helperId = generatedId ? `${generatedId}-helper` : undefined;

  return (
    <div className={cn('select-wrapper', error && 'select-wrapper--error', className)}>
      {label && (
        <label htmlFor={generatedId} className="select-label">
          {label}
          {required && <span className="select-label__required" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="select-container">
        <select
          ref={ref}
          id={generatedId}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className="select-field"
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.length > 0
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <span className="select-icon" aria-hidden="true">
          <ChevronDown size={18} />
        </span>
      </div>
      {error && <span id={errorId} className="select-error" role="alert">{error}</span>}
      {!error && helperText && <span id={helperId} className="select-helper">{helperText}</span>}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
