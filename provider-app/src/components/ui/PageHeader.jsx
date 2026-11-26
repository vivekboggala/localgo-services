import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { IconButton } from './IconButton';

export const PageHeader = ({
  eyebrow = null,
  title,
  subtitle = null,
  onBack = null,
  actions = null,
  className = '',
}) => (
  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}>
    <div className="flex items-start gap-3">
      {onBack && (
        <IconButton
          icon={<ArrowLeft className="w-5 h-5" strokeWidth={2} />}
          label="Go back"
          variant="secondary"
          rounded="pill"
          onClick={onBack}
          className="mt-0.5"
        />
      )}
      <div>
        {eyebrow && (
          <span className="block text-[11px] font-bold uppercase tracking-widest text-gray-600 dark:text-brand-yellow mb-1">
            {eyebrow}
          </span>
        )}
        <h1 className="font-display font-bold text-ds-24 sm:text-ds-32 text-brand-ink dark:text-brand-white tracking-tight">
          {title}
        </h1>
        {subtitle && <p className="text-ds-14 text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>

    {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
  </div>
);

export default PageHeader;
