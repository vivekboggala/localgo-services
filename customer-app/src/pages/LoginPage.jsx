import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import { AuthSplitLayout } from '../components/auth/AuthSplitLayout';
import { Button, Input, PasswordInput, showToast } from '../components/ui';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingVerifyOtp, setSendingVerifyOtp] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const validate = () => {
    const nextErrors = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!password) {
      nextErrors.password = 'Enter your password.';
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const user = await login(email, password);
      showToast.success(`Welcome back, ${user.name || user.email}!`);
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid email or password. Please try again.';
      setError(msg);
      showToast.error(msg.replace('EMAIL_NOT_VERIFIED: ', ''));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyExistingEmail = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;
    setSendingVerifyOtp(true);
    try {
      await api.post('/auth/send-otp', {
        email: cleanEmail,
        purpose: 'EMAIL_VERIFICATION',
      });
      showToast.success('Verification code sent to your email!');
      navigate(`/verify-email?email=${encodeURIComponent(cleanEmail)}&mode=verify-existing`);
    } catch (err) {
      showToast.error(err.response?.data?.message || err.message || 'Could not send verification OTP.');
    } finally {
      setSendingVerifyOtp(false);
    }
  };

  return (
    <AuthSplitLayout badgeText="Customer Sign In">
      <div className="bg-brand-white rounded-sheet border border-gray-200 shadow-sheet p-6 sm:p-8 space-y-6">
        <div className="space-y-1.5">
          <h2 className="font-display font-bold text-ds-24 text-brand-ink tracking-tight">
            Sign in to your account
          </h2>
          <p className="text-ds-14 text-gray-600">
            Book doorstep pros and track live service arrivals
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="p-4 bg-rose-50 border border-status-danger/30 text-status-danger text-ds-12 rounded-card font-semibold space-y-3"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
              <span>{error.replace('EMAIL_NOT_VERIFIED: ', '')}</span>
            </div>
            {error.includes('EMAIL_NOT_VERIFIED') && (
              <Button
                variant="danger"
                fullWidth
                loading={sendingVerifyOtp}
                onClick={handleVerifyExistingEmail}
              >
                Verify Email Code Now
              </Button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: '' }));
            }}
            error={fieldErrors.email}
            placeholder="name@example.com"
            leftIcon={<Mail className="w-5 h-5" strokeWidth={2} />}
            autoComplete="email"
          />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="customer-login-password" className="text-ds-12 font-semibold text-gray-900 tracking-wide">
                Password <span className="text-status-danger ml-0.5">*</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-ds-12 font-bold text-brand-ink hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="customer-login-password"
              label=""
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: '' }));
              }}
              error={fieldErrors.password}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          <Button
            type="submit"
            variant="accent"
            size="lg"
            fullWidth
            loading={loading}
            rightIcon={<ArrowRight className="w-5 h-5" strokeWidth={2.2} />}
            className="mt-2"
          >
            Sign In
          </Button>
        </form>

        <div className="text-center text-ds-14 text-gray-600 pt-4 border-t border-gray-100">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-brand-ink font-bold hover:underline">
            Create Account
          </Link>
        </div>
      </div>
    </AuthSplitLayout>
  );
};
