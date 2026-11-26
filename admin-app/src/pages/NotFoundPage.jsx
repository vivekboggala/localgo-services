import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import { Button, Logo } from '../components/ui';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-brand-white rounded-sheet border border-gray-200 shadow-sheet p-8 space-y-6">
        <div className="flex justify-center">
          <Logo size="md" subtitle="Admin Console" />
        </div>
        <div className="w-16 h-16 rounded-full bg-brand-yellowSoft border border-brand-yellow text-brand-ink flex items-center justify-center mx-auto">
          <Compass className="w-8 h-8" strokeWidth={2} />
        </div>
        <div className="space-y-1.5">
          <span className="font-display font-extrabold text-ds-40 text-brand-ink block leading-none">404</span>
          <h1 className="font-display font-bold text-ds-20 text-brand-ink">Admin page not found</h1>
          <p className="text-ds-14 text-gray-600">
            This console route does not exist or may have moved.
          </p>
        </div>
        <Link to="/dashboard" className="block">
          <Button variant="accent" fullWidth leftIcon={<ArrowLeft className="w-4 h-4" strokeWidth={2.2} />}>
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
