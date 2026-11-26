import React, { useId } from 'react';

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
        <label htmlFor={selectId} className="block text-ds-12 font-semibold text-gray-900 tracking-wide">
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
          className={`w-full h-12 bg-brand-white text-ds-14 font-medium text-brand-ink rounded-input border pl-4 pr-3 py-0 leading-[46px] transition-all duration-150 outline-none cursor-pointer ${
            error
              ? 'border-status-danger focus:ring-2 focus:ring-status-danger/20'
              : 'border-gray-200 focus:border-brand-ink focus:ring-2 focus:ring-brand-ink/10'
          } disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed`}
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
      </div>

      {error ? (
        <p className="text-ds-12 font-medium text-status-danger">{error}</p>
      ) : helperText ? (
        <p className="text-ds-12 text-gray-600">{helperText}</p>
      ) : null}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
