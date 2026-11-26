import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../api/axios';
import { Badge, Button, Input, Logo, OtpInput, PasswordInput, showToast } from '../../components/ui';

const RESET_STEPS = [
  { id: 1, label: 'Email' },
  { id: 2, label: 'Verify OTP' },
  { id: 3, label: 'New Password' },
];

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState('');
  const [cooldownLeft, setCooldownLeft] = useState(0);

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const t = setInterval(() => setCooldownLeft((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldownLeft]);

  const syncCooldownFromError = (err) => {
    if (err.response?.status === 429) {
      const retrySec = err.response?.data?.data?.retryAfterSeconds || Number(err.response?.headers?.['retry-after']) || 60;
      setCooldownLeft(retrySec);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      const msg = res.data?.message || 'If an account exists for this email, a verification code has been sent.';
      setInfoMessage(msg);
      showToast.success(msg);
      setOtp('');
      setVerificationToken('');
      setStep(2);
    } catch (err) {
      syncCooldownFromError(err);
      const msg = err.response?.data?.message || err.message || 'Failed to send password reset code.';
      setError(msg);
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/verify-reset-otp', {
        email: email.trim().toLowerCase(),
        otp,
        purpose: 'PASSWORD_RESET',
      });
      const token = res.data?.data?.verificationToken;
      if (!token) {
        throw new Error('Verification succeeded but reset token was missing. Please request a new code.');
      }
      setVerificationToken(token);
      setInfoMessage('');
      showToast.success('OTP verified! Please enter your new password.');
      setStep(3);
    } catch (err) {
      syncCooldownFromError(err);
      const msg = err.response?.data?.message || err.message || 'Invalid verification code. Please try again.';
      setError(msg);
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        verificationToken,
        newPassword,
      });

      showToast.success('Password reset successfully! You can now log in.');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Password reset failed. Please verify your OTP again.';
      setError(msg);
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      await api.post('/auth/resend-otp', {
        email: email.trim().toLowerCase(),
        purpose: 'PASSWORD_RESET',
      });
      setCooldownLeft(30);
      showToast.success('A new verification code has been sent to your email.');
    } catch (err) {
      syncCooldownFromError(err);
      const msg = err.response?.data?.message || err.message || 'Failed to resend code. Please wait before trying again.';
      setError(msg);
      showToast.error(msg);
    }
  };

  const resetToEmailStep = () => {
    setStep(1);
    setOtp('');
    setVerificationToken('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setInfoMessage('');
  };

  return (
    <div className="relative min-h-screen bg-brand-ink bg-gradient-to-br from-brand-ink via-gray-900 to-brand-ink flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-dark-grid-pattern opacity-80" />
      <div className="relative z-10 w-full max-w-md bg-brand-white rounded-sheet shadow-sheet border border-gray-200 p-7 sm:p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Logo size="md" subtitle="Admin Console" />
          </div>
          <div className="flex justify-center">
            <Badge tone="accent" icon={<ShieldCheck className="w-3.5 h-3.5" strokeWidth={2.5} />}>
              Admin access only
            </Badge>
          </div>
        </div>

        {/* 3-Step Indicator */}
        <div className="grid grid-cols-3 gap-2">
          {RESET_STEPS.map((s) => {
            const done = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} className="space-y-1.5">
                <div
                  className={`h-2 rounded-pill transition-colors ${
                    done ? 'bg-status-success' : active ? 'bg-brand-yellow' : 'bg-gray-200'
                  }`}
                />
                <span className={`block text-[11px] font-bold text-center ${active || done ? 'text-brand-ink' : 'text-gray-400'}`}>
                  {s.id}. {s.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="text-center space-y-1">
          <h1 className="font-display font-bold text-ds-24 text-brand-ink tracking-tight">
            {step === 1 ? 'Reset Admin Password' : step === 2 ? 'Verify Reset Code' : 'Create New Password'}
          </h1>
          <p className="text-ds-12 text-gray-600">
            {step === 1
              ? "Enter your administrator email and we'll send a 6-digit verification code."
              : step === 2
                ? `Enter the 6-digit code sent to ${email}`
                : `Choose a strong new password for ${email}`}
          </p>
        </div>

        {infoMessage && step === 2 && (
          <div className="p-3 text-ds-12 rounded-card bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
            {infoMessage}
          </div>
        )}

        {step === 3 && (
          <div className="p-3 text-ds-12 rounded-card bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" />
            <span>OTP verified! Set your new password below.</span>
          </div>
        )}

        {error && (
          <div role="alert" className="p-3.5 text-ds-12 rounded-card bg-rose-50 border border-status-danger/30 text-status-danger font-semibold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <Input
              label="Admin Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@localgo.com"
              leftIcon={<Mail className="w-5 h-5" strokeWidth={2} />}
            />

            <Button
              type="submit"
              variant="accent"
              size="lg"
              fullWidth
              loading={loading}
              disabled={cooldownLeft > 0}
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              {loading ? 'Sending Code...' : cooldownLeft > 0 ? `Retry in ${cooldownLeft}s` : 'Send Verification Code'}
            </Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <OtpInput
              length={6}
              value={otp}
              onChange={(code) => {
                setOtp(code);
                if (error) setError(null);
              }}
              onComplete={(code) => setOtp(code)}
              onResend={handleResendOtp}
              externalCooldown={cooldownLeft}
              disabled={loading || cooldownLeft > 0}
            />

            <Button
              type="submit"
              variant="accent"
              size="lg"
              fullWidth
              loading={loading}
              disabled={otp.length !== 6 || cooldownLeft > 0}
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              {loading ? 'Verifying OTP...' : 'Verify OTP & Continue'}
            </Button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <PasswordInput
              label="New Password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="At least 6 characters"
            />

            <PasswordInput
              label="Confirm New Password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Re-enter new password"
            />

            <Button
              type="submit"
              variant="accent"
              size="lg"
              fullWidth
              loading={loading}
              disabled={newPassword.length < 6 || confirmPassword.length < 6}
            >
              {loading ? 'Resetting Password...' : 'Save New Password'}
            </Button>
          </form>
        )}

        <div className="text-center pt-2 border-t border-gray-100 flex items-center justify-center gap-4 text-ds-12 font-semibold">
          {step >= 2 && (
            <button
              type="button"
              onClick={resetToEmailStep}
              className="text-gray-600 hover:text-brand-ink underline cursor-pointer"
            >
              Change Email
            </button>
          )}
          <Link to="/login" className="text-gray-600 hover:text-brand-ink underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
