import React from 'react';

export const Card = ({
  children,
  variant = 'default',
  interactive = false,
  padding = 'md',
  className = '',
  ...props
}) => {
  const paddingMap = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-5',
    lg: 'p-5 sm:p-6',
  };

  const surfaceMap = {
    default: 'bg-brand-white dark:bg-gray-900 text-brand-ink dark:text-brand-white border border-gray-200 dark:border-gray-600/25 shadow-card',
    subtle: 'bg-gray-50 dark:bg-brand-ink text-brand-ink dark:text-brand-white border border-gray-200 dark:border-gray-600/25',
    dark: 'bg-brand-ink text-brand-white border border-gray-900 shadow-panel',
    accent: 'bg-brand-yellowSoft dark:bg-brand-yellow/10 text-brand-ink dark:text-brand-white border border-brand-yellow shadow-card',
  };

  return (
    <div
      className={`rounded-card transition-all duration-150 ${surfaceMap[variant] || surfaceMap.default} ${
        paddingMap[padding] || paddingMap.md
      } ${interactive ? 'hover:shadow-card-hover hover:border-gray-400 dark:hover:border-brand-yellow/60 active:scale-[0.99] cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`pb-3 border-b border-gray-100 dark:border-gray-600/20 ${className}`}>{children}</div>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`py-3 ${className}`}>{children}</div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`pt-3 border-t border-gray-100 dark:border-gray-600/20 flex items-center justify-between gap-3 ${className}`}>
    {children}
  </div>
);

export default Card;
