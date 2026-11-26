import React, { useId } from 'react';

export const Toggle = ({
  checked = false,
  onChange,
  label,
  description = null,
  tone = 'success', // 'success' | 'yellow' | 'ink'
  disabled = false,
  className = '',
}) => {
  const id = useId();

  const trackActiveClass =
    tone === 'yellow'
      ? 'bg-brand-yellow'
      : tone === 'ink'
        ? 'bg-brand-ink'
        : 'bg-status-success';

  return (
    <div className={`flex items-center justify-between gap-4 min-h-[48px] ${className}`}>
      {(label || description) && (
        <label htmlFor={id} className="cursor-pointer select-none flex-1">
          {label && <span className="block text-ds-14 font-semibold text-brand-ink">{label}</span>}
          {description && <span className="block text-ds-12 text-gray-600 mt-0.5">{description}</span>}
        </label>
      )}

      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange?.(!checked)}
        className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-pill border-2 border-transparent transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed ${
          checked ? trackActiveClass : 'bg-gray-200'
        }`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-brand-white shadow-card transition duration-150 ease-in-out ${
            checked ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

export default Toggle;
