import React from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';
import { Button } from './Button';

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'Unable to load data right now. Please try again.',
  onRetry = null,
  retryLabel = 'Try Again',
  compact = false,
  className = '',
}) => {
  if (compact) {
    return (
      <div
        role="alert"
        className={`bg-rose-50 border border-status-danger/30 rounded-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}
      >
        <div className="flex items-start gap-2.5 text-status-danger">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" strokeWidth={2} />
          <p className="text-ds-14 font-semibold text-brand-ink">{message}</p>
        </div>
        {onRetry && (
          <Button
            variant="danger"
            onClick={onRetry}
            leftIcon={<RotateCw className="w-4 h-4" strokeWidth={2} />}
            className="shrink-0"
          >
            {retryLabel}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={`bg-brand-white border border-status-danger/30 rounded-card p-8 text-center shadow-card space-y-4 ${className}`}
    >
      <div className="w-14 h-14 rounded-sheet bg-rose-50 text-status-danger border border-rose-200 flex items-center justify-center mx-auto">
        <AlertCircle className="w-7 h-7" strokeWidth={2} />
      </div>
      <div className="space-y-1.5 max-w-sm mx-auto">
        <h3 className="font-display font-bold text-ds-20 text-brand-ink">{title}</h3>
        <p className="text-ds-14 text-gray-600">{message}</p>
      </div>
      {onRetry && (
        <div className="pt-1 flex justify-center">
          <Button
            variant="primary"
            onClick={onRetry}
            leftIcon={<RotateCw className="w-4 h-4" strokeWidth={2} />}
          >
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ErrorState;
