import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

export const EmptyState = ({
  icon = null,
  title = 'Nothing here yet',
  description = 'Items matching your view will appear here.',
  actionLabel = null,
  onAction = null,
  actionVariant = 'primary',
  className = '',
}) => (
  <div
    className={`bg-brand-white border border-gray-200 rounded-card p-8 sm:p-10 text-center shadow-card space-y-4 ${className}`}
  >
    <div className="w-16 h-16 rounded-sheet bg-brand-yellowSoft border border-brand-yellow text-brand-ink flex items-center justify-center mx-auto">
      {icon || <Inbox className="w-7 h-7" strokeWidth={2} />}
    </div>
    <div className="space-y-1.5 max-w-sm mx-auto">
      <h3 className="font-display font-bold text-ds-20 text-brand-ink">{title}</h3>
      <p className="text-ds-14 text-gray-600">{description}</p>
    </div>
    {actionLabel && onAction && (
      <div className="pt-2 flex justify-center">
        <Button variant={actionVariant} onClick={onAction}>
          {actionLabel}
        </Button>
      </div>
    )}
  </div>
);

export default EmptyState;
