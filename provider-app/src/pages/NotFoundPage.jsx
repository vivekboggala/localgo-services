import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, LayoutDashboard, Inbox } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Button, Logo } from '../components/ui';

export const NotFoundPage = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-brand-ink flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="w-full max-w-md bg-brand-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600/30 rounded-sheet p-8 shadow-sheet space-y-6">
        <div className="flex justify-center">
          <Logo variant={isDark ? 'dark' : 'light'} size="md" subtitle="Partner" />
        </div>

        <div className="w-20 h-20 rounded-sheet bg-brand-yellow text-brand-ink flex items-center justify-center mx-auto shadow-card">
          <Compass className="w-10 h-10" strokeWidth={2.2} />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-pill bg-brand-yellowSoft dark:bg-brand-yellow/15 border border-brand-yellow text-ds-12 font-bold text-brand-ink dark:text-brand-yellow">
            Error 404
          </span>
          <h1 className="font-display font-bold text-ds-32 text-brand-ink dark:text-brand-white tracking-tight">
            Page not found
          </h1>
          <p className="text-ds-14 text-gray-600 dark:text-gray-400">
            This partner page does not exist or moved. Jump back to your dashboard or live requests.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="accent"
            fullWidth
            leftIcon={<LayoutDashboard className="w-5 h-5" strokeWidth={2} />}
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </Button>
          <Button
            variant="secondary"
            fullWidth
            leftIcon={<Inbox className="w-5 h-5" strokeWidth={2} />}
            onClick={() => navigate('/requests')}
          >
            Requests
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
