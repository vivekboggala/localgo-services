import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../api/axios';
import { AuthSplitLayout } from '../../components/auth/AuthSplitLayout';
import { Button, Input, OtpInput, PasswordInput, showToast } from '../../components/ui';

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
        throw new Error('Verification succeeded but reset token was missing.');
      }
      setVerificationToken(token);
      setInfoMessage('');
      showToast.success('Code verified! Set your new password.');
      setStep(3);
    } catch (err) {
      syncCooldownFromError(err);
      const msg = err.response?.data?.message || err.message || 'Invalid verification code.';
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

      showToast.success('Password reset successfully! Please sign in.');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Password reset failed.';
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
      const msg = err.response?.data?.message || err.message || 'Failed to resend code.';
      setError(msg);
      showToast.error(msg);
    }
  };

  return (
    <AuthSplitLayout badgeText="Partner Account Recovery">
      <div className="bg-brand-white dark:bg-gray-900 rounded-sheet border border-gray-200 dark:border-gray-600/30 shadow-sheet p-6 sm:p-8 space-y-6">
        <div className="space-y-1.5">
          <h1 className="font-display font-bold text-ds-24 text-brand-ink dark:text-brand-white tracking-tight">
            {step === 1 ? 'Forgot password?' : step === 2 ? 'Enter verification code' : 'Create new password'}
          </h1>
          <p className="text-ds-14 text-gray-600 dark:text-gray-400">
            {step === 1
              ? "Enter your partner email and we'll send a 6-digit verification code."
              : step === 2
                ? `Enter the 6-digit code sent to ${email}`
                : `Set a strong new password for ${email}`}
          </p>
        </div>

        {infoMessage && step === 2 && (
          <div className="p-3 rounded-card bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-ds-12 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        {error && (
          <div role="alert" className="p-3.5 rounded-card bg-rose-500/10 border border-status-danger/30 text-status-danger text-ds-12 font-semibold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
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
              placeholder="partner@example.com"
              leftIcon={<Mail className="w-5 h-5" />}
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

            <Button
              type="submit"
              variant="accent"
              size="lg"
              fullWidth
              loading={loading}
              disabled={otp.length !== 6 || cooldownLeft > 0}
              rightIcon={<ArrowRight className="w-5 h-5" />}
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
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
            />

            <PasswordInput
              label="Confirm New Password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
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
              onClick={() => {
                setStep(1);
                setError(null);
              }}
              className="text-gray-400 hover:text-brand-ink dark:hover:text-brand-white underline"
            >
              Change Email
            </button>
          )}
          <Link to="/login" className="text-gray-400 hover:text-brand-ink dark:hover:text-brand-white underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </AuthSplitLayout>
  );
};

export default ForgotPasswordPage;
