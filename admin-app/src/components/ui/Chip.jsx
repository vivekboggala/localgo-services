import React from 'react';

export const Chip = ({
  children,
  selected = false,
  tone = 'ink',
  leftIcon = null,
  count = null,
  disabled = false,
  onClick,
  className = '',
  type = 'button',
  ...props
}) => {
  const activeStyle =
    tone === 'yellow'
      ? 'bg-brand-yellow text-brand-ink border-brand-yellow shadow-card'
      : 'bg-brand-ink text-brand-white border-brand-ink shadow-card';

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex items-center gap-2 min-h-[40px] sm:min-h-[44px] px-4 py-2 rounded-pill text-ds-12 font-semibold whitespace-nowrap border transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed ${
        selected
          ? activeStyle
          : 'bg-brand-white text-gray-900 border-gray-200 hover:bg-gray-50 hover:border-gray-400'
      } ${className}`}
      {...props}
    >
      {leftIcon && <span className="shrink-0 inline-flex">{leftIcon}</span>}
      <span>{children}</span>
      {count !== null && count !== undefined && (
        <span
          className={`px-2 py-0.5 rounded-pill text-[11px] font-bold ${
            selected ? 'bg-white/20 text-current' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
};

export default Chip;
