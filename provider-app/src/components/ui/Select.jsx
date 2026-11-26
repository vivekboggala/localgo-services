import React, { useId } from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = React.forwardRef(({
  label,
  options = [],
  placeholder = null,
  helperText,
  error,
  id,
  required = false,
  className = '',
  children,
  ...props
}, ref) => {
  const autoId = useId();
  const selectId = id || autoId;

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={selectId} className="block text-ds-12 font-bold text-gray-900 dark:text-gray-200 tracking-wide">
          {label}
          {required && <span className="text-status-danger ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          required={required}
          aria-invalid={Boolean(error)}
          className={`w-full min-h-[52px] appearance-none bg-brand-white dark:bg-brand-ink text-ds-14 font-semibold text-brand-ink dark:text-brand-white rounded-input border pl-4 pr-10 transition-all duration-150 outline-none ${
            error
              ? 'border-status-danger focus:ring-2 focus:ring-status-danger/20'
              : 'border-gray-200 dark:border-gray-600/50 focus:border-brand-ink dark:focus:border-brand-yellow focus:ring-2 focus:ring-brand-ink/10 dark:focus:ring-brand-yellow/20'
          } disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {children ||
            options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
        </select>
        <ChevronDown
          className="w-5 h-5 text-gray-600 dark:text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          strokeWidth={2}
          aria-hidden="true"
        />
      </div>

      {error ? (
        <p className="text-ds-12 font-semibold text-status-danger">{error}</p>
      ) : helperText ? (
        <p className="text-ds-12 text-gray-600 dark:text-gray-400">{helperText}</p>
      ) : null}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
