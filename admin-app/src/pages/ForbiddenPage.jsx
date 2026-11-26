import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button, Logo } from '../components/ui';

export const ForbiddenPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-ink via-gray-900 to-brand-ink bg-dark-grid-pattern flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-brand-white rounded-sheet border border-gray-200 shadow-sheet p-8 space-y-6">
        <div className="flex justify-center">
          <Logo size="md" subtitle="Admin Console" />
        </div>
        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 text-status-danger flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" strokeWidth={2} />
        </div>
        <div className="space-y-1.5">
          <span className="font-display font-extrabold text-ds-40 text-brand-ink block leading-none">403</span>
          <h1 className="font-display font-bold text-ds-20 text-brand-ink">Admin access required</h1>
          <p className="text-ds-14 text-gray-600">
            Your signed-in account does not hold administrator privileges for this console.
          </p>
        </div>
        <Button
          variant="danger"
          fullWidth
          leftIcon={<LogOut className="w-4 h-4" strokeWidth={2.2} />}
          onClick={handleSignOut}
        >
          Sign out &amp; switch account
        </Button>
      </div>
    </div>
  );
};

export default ForbiddenPage;
