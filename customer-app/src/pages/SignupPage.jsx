import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, ArrowRight, AlertCircle, Check } from 'lucide-react';
import api from '../api/axios';
import { AuthSplitLayout } from '../components/auth/AuthSplitLayout';
import { Button, Input, PasswordInput, showToast } from '../components/ui';

const getPasswordStrength = (pwd) => {
  if (!pwd) return { score: 0, label: 'Enter password', barClass: 'bg-gray-200', width: '0%' };
  let score = 0;
  if (pwd.length >= 6) score += 1;
  if (pwd.length >= 8) score += 1;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
  if (/\d/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 1;

  if (score <= 1) return { score: 1, label: 'Weak', barClass: 'bg-status-danger', width: '25%' };
  if (score === 2) return { score: 2, label: 'Fair', barClass: 'bg-status-warning', width: '50%' };
  if (score === 3) return { score: 3, label: 'Good', barClass: 'bg-status-info', width: '75%' };
  return { score: 4, label: 'Strong', barClass: 'bg-status-success', width: '100%' };
};

export const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  const navigate = useNavigate();
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const t = setInterval(() => setCooldownLeft((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldownLeft]);

  const validate = () => {
    const next = {};
    if (name.trim().length < 2) next.name = 'Enter your full name.';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Enter a valid email address.';
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      next.phone = 'Enter a valid 10-digit phone number.';
    }
    if (password.length < 6) {
      next.password = 'Password must be at least 6 characters.';
    }
    if (confirmPassword !== password) {
      next.confirmPassword = 'Passwords do not match.';
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const pendingRegistration = {
      role: 'CUSTOMER',
      payload: { name: name.trim(), email: cleanEmail, phone: phone.trim(), password },
    };

    try {
      await api.post('/auth/send-otp', {
        email: cleanEmail,
        purpose: 'EMAIL_VERIFICATION',
      });
      sessionStorage.setItem('localgo_pending_registration', JSON.stringify(pendingRegistration));
      showToast.success('Verification code sent to your email!');
      navigate(`/verify-email?email=${encodeURIComponent(cleanEmail)}`, {
        state: { pendingRegistration },
      });
    } catch (err) {
      if (err.response?.status === 429) {
        const retrySec = err.response?.data?.data?.retryAfterSeconds || Number(err.response?.headers?.['retry-after']) || 60;
        setCooldownLeft(retrySec);
      }
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Could not send verification OTP. Please try again.';
      setError(msg);
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout badgeText="New Customer Account">
      <div className="bg-brand-white rounded-sheet border border-gray-200 shadow-sheet p-6 sm:p-8 space-y-6">
        <div className="space-y-1.5">
          <h2 className="font-display font-bold text-ds-24 text-brand-ink tracking-tight">
            Create your account
          </h2>
          <p className="text-ds-14 text-gray-600">
            Verify your email via OTP to start booking trusted pros
          </p>
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

        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          <Input
            label="Full Name"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: '' }));
            }}
            error={fieldErrors.name}
            placeholder="e.g. Rahul Sharma"
            leftIcon={<User className="w-5 h-5" strokeWidth={2} />}
            autoComplete="name"
          />

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
            placeholder="rahul@example.com"
            leftIcon={<Mail className="w-5 h-5" strokeWidth={2} />}
            autoComplete="email"
          />

          <Input
            label="Phone Number"
            type="tel"
            required
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: '' }));
            }}
            error={fieldErrors.phone}
            placeholder="9876543210"
            leftIcon={<Phone className="w-5 h-5" strokeWidth={2} />}
            autoComplete="tel"
          />

          <div className="space-y-2">
            <PasswordInput
              label="Password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: '' }));
              }}
              error={fieldErrors.password}
              placeholder="Minimum 6 characters"
              autoComplete="new-password"
            />

            {/* Password Strength Meter */}
            {password.length > 0 && (
              <div className="space-y-1.5 pt-0.5">
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-gray-600">Password strength</span>
                  <span className="text-brand-ink">{strength.label}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-pill overflow-hidden">
                  <div
                    className={`h-full transition-all duration-200 rounded-pill ${strength.barClass}`}
                    style={{ width: strength.width }}
                  />
                </div>
                <div className="flex flex-wrap gap-3 text-[11px] text-gray-600 pt-0.5">
                  <span className={`inline-flex items-center gap-1 ${password.length >= 6 ? 'text-status-success font-semibold' : ''}`}>
                    <Check className="w-3 h-3" strokeWidth={2.5} /> 6+ chars
                  </span>
                  <span className={`inline-flex items-center gap-1 ${/[A-Z]/.test(password) ? 'text-status-success font-semibold' : ''}`}>
                    <Check className="w-3 h-3" strokeWidth={2.5} /> Uppercase
                  </span>
                  <span className={`inline-flex items-center gap-1 ${/\d/.test(password) ? 'text-status-success font-semibold' : ''}`}>
                    <Check className="w-3 h-3" strokeWidth={2.5} /> Number
                  </span>
                </div>
              </div>
            )}
          </div>

          <PasswordInput
            label="Confirm Password"
            required
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (fieldErrors.confirmPassword) setFieldErrors((p) => ({ ...p, confirmPassword: '' }));
            }}
            error={fieldErrors.confirmPassword}
            placeholder="Re-enter password"
            autoComplete="new-password"
          />

          <Button
            type="submit"
            variant="accent"
            size="lg"
            fullWidth
            loading={loading}
            disabled={cooldownLeft > 0}
            rightIcon={<ArrowRight className="w-5 h-5" strokeWidth={2.2} />}
            className="mt-2"
          >
            {cooldownLeft > 0 ? `Wait ${cooldownLeft}s to Retry` : 'Continue & Verify Email'}
          </Button>
        </form>

        <div className="text-center text-ds-14 text-gray-600 pt-4 border-t border-gray-100">
          Already registered?{' '}
          <Link to="/login" className="text-brand-ink font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </AuthSplitLayout>
  );
};
