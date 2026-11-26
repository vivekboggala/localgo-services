import React from 'react';
import { AlertOctagon, Home, RotateCw } from 'lucide-react';
import { Button, Logo } from '../components/ui';

export const ErrorPage = ({
  title = 'Something hit a snag',
  message = 'An unexpected issue interrupted this screen. Refresh the page or head back home.',
  onReset = null,
}) => {
  const handleReload = () => {
    if (onReset) {
      onReset();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-brand-white bg-grid-pattern flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="w-full max-w-md bg-brand-white border border-gray-200 rounded-sheet p-8 shadow-sheet space-y-6">
        <div className="flex justify-center">
          <Logo size="md" />
        </div>

        <div className="w-20 h-20 rounded-sheet bg-rose-50 border border-rose-200 text-status-danger flex items-center justify-center mx-auto">
          <AlertOctagon className="w-10 h-10" strokeWidth={2} />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-pill bg-rose-50 border border-rose-200 text-ds-12 font-bold text-status-danger">
            Application Error
          </span>
          <h1 className="font-display font-bold text-ds-24 text-brand-ink tracking-tight">
            {title}
          </h1>
          <p className="text-ds-14 text-gray-600 leading-relaxed">{message}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="accent"
            fullWidth
            leftIcon={<RotateCw className="w-5 h-5" strokeWidth={2} />}
            onClick={handleReload}
          >
            Try Again
          </Button>
          <Button
            variant="secondary"
            fullWidth
            leftIcon={<Home className="w-5 h-5" strokeWidth={2} />}
            onClick={() => {
              window.location.href = '/';
            }}
          >
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
