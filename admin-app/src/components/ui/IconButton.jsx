import React from 'react';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-brand-ink text-brand-white hover:bg-gray-900 border border-brand-ink shadow-card',
  accent: 'bg-brand-yellow text-brand-ink hover:bg-brand-yellowHover border border-brand-yellow shadow-card',
  secondary: 'bg-brand-white text-brand-ink hover:bg-gray-50 border border-gray-200 shadow-card',
  ghost: 'bg-transparent text-brand-ink hover:bg-gray-100 border border-transparent',
  danger: 'bg-status-danger text-brand-white hover:bg-red-600 border border-status-danger shadow-card',
};

export const IconButton = React.forwardRef(({
  icon,
  label,
  variant = 'secondary',
  rounded = 'card',
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  ...props
}, ref) => {
  const radiusClass = rounded === 'pill' ? 'rounded-pill' : 'rounded-card';

  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center w-12 h-12 min-w-[48px] min-h-[48px] transition-all duration-150 active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed ${radiusClass} ${
        VARIANTS[variant] || VARIANTS.secondary
      } ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} aria-hidden="true" />
      ) : (
        icon
      )}
    </button>
  );
});

IconButton.displayName = 'IconButton';
export default IconButton;
