import React from 'react';
import { AlertOctagon, LayoutDashboard, RotateCw } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Button, Logo } from '../components/ui';

export const ErrorPage = ({
  title = 'Something hit a snag',
  message = 'An unexpected error occurred in Provider Studio. Refresh or head back to Home.',
  onReset = null,
}) => {
  const { isDark } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-brand-ink flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="w-full max-w-md bg-brand-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600/30 rounded-sheet p-8 shadow-sheet space-y-6">
        <div className="flex justify-center">
          <Logo variant={isDark ? 'dark' : 'light'} size="md" subtitle="Partner" />
        </div>

        <div className="w-20 h-20 rounded-sheet bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-status-danger/30 text-status-danger flex items-center justify-center mx-auto">
          <AlertOctagon className="w-10 h-10" strokeWidth={2} />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-pill bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-status-danger/30 text-ds-12 font-bold text-status-danger">
            Application Error
          </span>
          <h1 className="font-display font-bold text-ds-24 text-brand-ink dark:text-brand-white tracking-tight">
            {title}
          </h1>
          <p className="text-ds-14 text-gray-600 dark:text-gray-400">{message}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="accent"
            fullWidth
            leftIcon={<RotateCw className="w-5 h-5" strokeWidth={2} />}
            onClick={() => (onReset ? onReset() : window.location.reload())}
          >
            Reload
          </Button>
          <Button
            variant="secondary"
            fullWidth
            leftIcon={<LayoutDashboard className="w-5 h-5" strokeWidth={2} />}
            onClick={() => {
              window.location.href = '/dashboard';
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
