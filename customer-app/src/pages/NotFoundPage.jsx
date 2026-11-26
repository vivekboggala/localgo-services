import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Home, Search } from 'lucide-react';
import { Button, Logo } from '../components/ui';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-white bg-grid-pattern flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="w-full max-w-md bg-brand-white border border-gray-200 rounded-sheet p-8 shadow-sheet space-y-6">
        <div className="flex justify-center">
          <Logo size="md" />
        </div>

        <div className="w-20 h-20 rounded-sheet bg-brand-ink text-brand-yellow flex items-center justify-center mx-auto shadow-card">
          <Compass className="w-10 h-10" strokeWidth={2} />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-pill bg-brand-yellowSoft border border-brand-yellow text-ds-12 font-bold text-brand-ink">
            Error 404
          </span>
          <h1 className="font-display font-bold text-ds-32 text-brand-ink tracking-tight">
            We couldn&apos;t find that page
          </h1>
          <p className="text-ds-14 text-gray-600 leading-relaxed">
            The link may have moved or expired. Jump back home or explore available doorstep services near you.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="accent"
            fullWidth
            leftIcon={<Home className="w-5 h-5" strokeWidth={2} />}
            onClick={() => navigate('/')}
          >
            Go Home
          </Button>
          <Button
            variant="secondary"
            fullWidth
            leftIcon={<Search className="w-5 h-5" strokeWidth={2} />}
            onClick={() => navigate('/services')}
          >
            Browse Services
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
