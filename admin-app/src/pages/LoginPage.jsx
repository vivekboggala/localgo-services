import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Badge, Button, Input, Logo, PasswordInput, showToast } from '../components/ui';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      showToast.success(`Welcome back, ${user.name || 'Admin'}!`);
      const from = location.state?.from?.pathname;
      navigate(from || '/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid admin credentials.';
      setError(msg);
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-brand-ink bg-gradient-to-br from-brand-ink via-gray-900 to-brand-ink flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-dark-grid-pattern opacity-80" />
      <div className="relative z-10 w-full max-w-md bg-brand-white rounded-sheet shadow-sheet border border-gray-200 p-6 sm:p-7 space-y-5">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Logo size="md" subtitle="Admin Console" />
          </div>

          <div className="flex justify-center">
            <Badge tone="accent" icon={<ShieldCheck className="w-3.5 h-3.5" strokeWidth={2.5} />}>
              Admin access only
            </Badge>
          </div>

          <div className="space-y-1">
            <h1 className="font-display font-bold text-ds-24 text-brand-ink tracking-tight">
              Administrator Sign In
            </h1>
            <p className="text-ds-12 text-gray-600">
              Restricted operations portal to verify providers, oversee bookings, and moderate reviews.
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3.5 bg-rose-50 border border-status-danger/30 text-status-danger text-ds-12 rounded-card font-semibold flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Admin Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@localgo.com"
            leftIcon={<Mail className="w-5 h-5" strokeWidth={2} />}
          />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="admin-login-password" className="text-ds-12 font-semibold text-gray-900 tracking-wide">
                Password <span className="text-status-danger ml-0.5">*</span>
              </label>
              <Link to="/forgot-password" className="text-ds-12 font-bold text-brand-ink hover:underline">
                Forgot Password?
              </Link>
            </div>
            <PasswordInput
              id="admin-login-password"
              label=""
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>

          <Button
            type="submit"
            variant="accent"
            size="lg"
            fullWidth
            loading={loading}
            rightIcon={<ArrowRight className="w-5 h-5" strokeWidth={2.2} />}
          >
            {loading ? 'Signing In...' : 'Sign In to Admin Console'}
          </Button>
        </form>
      </div>
    </div>
  );
};
