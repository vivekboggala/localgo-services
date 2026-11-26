import React, { useId } from 'react';

export const Input = React.forwardRef(({
  label,
  helperText,
  error,
  leftIcon = null,
  rightElement = null,
  id,
  className = '',
  inputClassName = '',
  required = false,
  ...props
}, ref) => {
  const autoId = useId();
  const inputId = id || autoId;

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-ds-12 font-bold text-gray-900 dark:text-gray-200 tracking-wide"
        >
          {label}
          {required && <span className="text-status-danger ml-0.5">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3.5 text-gray-400 pointer-events-none inline-flex" aria-hidden="true">
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          className={`w-full min-h-[52px] bg-brand-white dark:bg-brand-ink text-ds-14 font-medium text-brand-ink dark:text-brand-white placeholder:text-gray-400 rounded-input border transition-all duration-150 outline-none ${
            leftIcon ? 'pl-11' : 'pl-4'
          } ${rightElement ? 'pr-12' : 'pr-4'} ${
            error
              ? 'border-status-danger focus:ring-2 focus:ring-status-danger/30'
              : 'border-gray-200 dark:border-gray-600/50 focus:border-brand-ink dark:focus:border-brand-yellow focus:ring-2 focus:ring-brand-ink/10 dark:focus:ring-brand-yellow/20'
          } disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed ${inputClassName}`}
          {...props}
        />

        {rightElement && (
          <div className="absolute right-2 flex items-center">
            {rightElement}
          </div>
        )}
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="text-ds-12 font-semibold text-status-danger">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-helper`} className="text-ds-12 text-gray-600 dark:text-gray-400">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
