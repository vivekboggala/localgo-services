import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ServerCrash, RotateCw } from 'lucide-react';
import { Button, Logo } from '../components/ui';

export const ErrorPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-brand-white rounded-sheet border border-gray-200 shadow-sheet p-8 space-y-6">
        <div className="flex justify-center">
          <Logo size="md" subtitle="Admin Console" />
        </div>
        <div className="w-16 h-16 rounded-full bg-rose-50 text-status-danger flex items-center justify-center mx-auto">
          <ServerCrash className="w-8 h-8" strokeWidth={2} />
        </div>
        <div className="space-y-1.5">
          <h1 className="font-display font-bold text-ds-24 text-brand-ink">Console Service Error</h1>
          <p className="text-ds-14 text-gray-600">
            We could not complete your request. Check your backend connection and retry.
          </p>
        </div>
        <div className="space-y-2.5">
          <Button
            variant="accent"
            fullWidth
            leftIcon={<RotateCw className="w-4 h-4" strokeWidth={2} />}
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
          <Button variant="secondary" fullWidth onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
