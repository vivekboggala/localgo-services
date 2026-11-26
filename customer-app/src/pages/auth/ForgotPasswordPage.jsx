import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { KeyRound, Mail, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import api from '../../api/axios';
import { AuthSplitLayout } from '../../components/auth/AuthSplitLayout';
import { Button, Input, OtpInput, PasswordInput, showToast } from '../../components/ui';

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
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      const msg = res.data?.message || 'Verification code sent to your email.';
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
    e?.preventDefault?.();
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
        throw new Error('Reset token missing. Please request a new code.');
      }
      setVerificationToken(token);
      setInfoMessage('');
      showToast.success('Code verified! Choose your new password.');
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
      setError('Passwords do not match.');
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

      showToast.success('Password reset successfully! Please sign in.');
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
      showToast.success('A new verification code has been sent.');
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
    <AuthSplitLayout badgeText="Account Recovery">
      <div className="bg-brand-white rounded-sheet border border-gray-200 shadow-sheet p-6 sm:p-8 space-y-6">
        {/* 3-Step Progress Indicator */}
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {RESET_STEPS.map((s) => {
              const active = step === s.id;
              const done = step > s.id;
              return (
                <div key={s.id} className="space-y-1.5">
                  <div
                    className={`h-2 rounded-pill transition-colors duration-200 ${
                      done ? 'bg-status-success' : active ? 'bg-brand-yellow' : 'bg-gray-200'
                    }`}
                  />
                  <span
                    className={`block text-[11px] font-bold text-center ${
                      active || done ? 'text-brand-ink' : 'text-gray-400'
                    }`}
                  >
                    {s.id}. {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Heading */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-sheet bg-brand-yellowSoft border border-brand-yellow text-brand-ink flex items-center justify-center mx-auto">
            {step === 2 ? (
              <ShieldCheck className="w-7 h-7" strokeWidth={2} />
            ) : step === 3 ? (
              <Lock className="w-7 h-7" strokeWidth={2} />
            ) : (
              <KeyRound className="w-7 h-7" strokeWidth={2} />
            )}
          </div>
          <h1 className="font-display font-bold text-ds-24 text-brand-ink tracking-tight">
            {step === 1 ? 'Forgot Password?' : step === 2 ? 'Verify Reset Code' : 'Create New Password'}
          </h1>
          <p className="text-ds-14 text-gray-600">
            {step === 1
              ? "Enter your email address and we'll send a 6-digit code."
              : step === 2
                ? `Enter the 6-digit code sent to ${email}`
                : `Set a strong new password for ${email}`}
          </p>
        </div>

        {infoMessage && step === 2 && (
          <div className="p-3 rounded-card bg-emerald-50 border border-emerald-200 text-emerald-800 text-ds-12 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2} />
            <span>{infoMessage}</span>
          </div>
        )}

        {step === 3 && (
          <div className="p-3 rounded-card bg-emerald-50 border border-emerald-200 text-emerald-800 text-ds-12 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2} />
            <span>OTP verified! Set your new password below.</span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="p-3.5 rounded-card bg-rose-50 border border-status-danger/30 text-status-danger text-ds-12 font-semibold flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
            <span>{error}</span>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleRequestOtp} noValidate className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              placeholder="name@example.com"
              leftIcon={<Mail className="w-5 h-5" strokeWidth={2} />}
            />

            <Button
              type="submit"
              variant="accent"
              size="lg"
              fullWidth
              loading={loading}
              disabled={cooldownLeft > 0}
              rightIcon={<ArrowRight className="w-5 h-5" strokeWidth={2.2} />}
            >
              {cooldownLeft > 0 ? `Retry in ${cooldownLeft}s` : 'Send Verification Code'}
            </Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <OtpInput
              length={6}
              cooldownSeconds={30}
              externalCooldown={cooldownLeft}
              autoFocus
              onComplete={(code) => setOtp(code)}
              onChange={(code) => {
                setOtp(code);
                if (error) setError(null);
              }}
              onResend={handleResendOtp}
              disabled={loading || cooldownLeft > 0}
            />

            {cooldownLeft > 0 && (
              <p className="text-ds-12 font-semibold text-amber-900 bg-amber-50 border border-amber-200 rounded-card px-3.5 py-2.5 text-center">
                Cooldown active: wait {cooldownLeft}s before trying again.
              </p>
            )}

            <Button
              type="submit"
              variant="accent"
              size="lg"
              fullWidth
              loading={loading}
              disabled={otp.length !== 6 || cooldownLeft > 0}
              rightIcon={<ArrowRight className="w-5 h-5" strokeWidth={2.2} />}
            >
              Verify OTP &amp; Continue
            </Button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} noValidate className="space-y-4">
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
              Save New Password
            </Button>
          </form>
        )}

        <div className="text-center pt-2 flex items-center justify-center gap-4 text-ds-12 font-bold">
          {step >= 2 && (
            <button
              type="button"
              onClick={resetToEmailStep}
              className="text-gray-600 hover:text-brand-ink underline"
            >
              Change Email
            </button>
          )}
          <Link to="/login" className="text-gray-600 hover:text-brand-ink underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </AuthSplitLayout>
  );
};

export default ForgotPasswordPage;
