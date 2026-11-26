import React from 'react';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-brand-ink text-brand-white hover:bg-gray-900 border border-brand-ink dark:bg-brand-white dark:text-brand-ink dark:border-brand-white dark:hover:bg-gray-100 shadow-card',
  accent: 'bg-brand-yellow text-brand-ink hover:bg-brand-yellowHover border border-brand-yellow shadow-card',
  secondary: 'bg-brand-white text-brand-ink hover:bg-gray-50 border border-gray-200 dark:bg-gray-900 dark:text-brand-white dark:border-gray-600/40 dark:hover:bg-gray-600/25 shadow-card',
  ghost: 'bg-transparent text-brand-ink hover:bg-gray-100 dark:text-brand-white dark:hover:bg-gray-900 border border-transparent',
  danger: 'bg-status-danger text-brand-white hover:bg-red-600 border border-status-danger shadow-card',
};

const SIZES = {
  md: 'min-h-[52px] px-5 py-3 text-ds-14 rounded-card',
  lg: 'min-h-[56px] px-6 py-3.5 text-ds-16 rounded-card',
  pill: 'min-h-[52px] px-6 py-3 text-ds-14 rounded-pill',
};

export const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon = null,
  rightIcon = null,
  type = 'button',
  className = '',
  ...props
}, ref) => {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading}
      className={`inline-flex items-center justify-center gap-2 font-bold tracking-tight transition-all duration-150 select-none active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${
        VARIANTS[variant] || VARIANTS.primary
      } ${SIZES[size] || SIZES.md} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin shrink-0" strokeWidth={2} aria-hidden="true" />
      ) : (
        leftIcon && <span className="shrink-0 inline-flex">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!loading && rightIcon && <span className="shrink-0 inline-flex">{rightIcon}</span>}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
