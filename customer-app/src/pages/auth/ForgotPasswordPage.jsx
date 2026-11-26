import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { KeyRound, Mail, ArrowRight, Lock, ShieldCheck, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import OtpInput from '../../components/common/OtpInput';

const STEPS = [
  { num: 1, label: 'Email' },
  { num: 2, label: 'Verify OTP' },
  { num: 3, label: 'New Password' },
];

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email Request, 2: Verify OTP, 3: Set New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState('');

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
      toast.success(msg);
      setOtp('');
      setVerificationToken('');
      setStep(2);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to send password reset code.';
      setError(msg);
      toast.error(msg);
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
      toast.success('OTP verified! Please enter your new password.');
      setStep(3);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid verification code. Please try again.';
      setError(msg);
      toast.error(msg);
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

      toast.success('Password reset successfully! You can now log in.');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Password reset failed. Please verify your OTP again.';
      setError(msg);
      toast.error(msg);
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
      toast.success('A new verification code has been sent to your email.');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to resend code. Please wait before trying again.';
      toast.error(msg);
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
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center mx-auto mb-3">
            {step === 2 ? <ShieldCheck className="w-6 h-6 text-blue-600" /> : step === 3 ? <Lock className="w-6 h-6 text-emerald-600" /> : <KeyRound className="w-6 h-6" />}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {step === 1 ? 'Forgot Password?' : step === 2 ? 'Verify Reset Code' : 'Create New Password'}
          </h1>
          <p className="text-sm text-slate-600">
            {step === 1
              ? "Enter your email address and we'll send you a 6-digit verification code."
              : step === 2
                ? `Enter the 6-digit code sent to ${email} to verify your identity.`
                : `Your code is verified. Set a strong new password for ${email}.`}
          </p>
        </div>

        {/* 3-Step Indicator */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {STEPS.map((s) => {
            const done = step > s.num;
            const active = step === s.num;
            return (
              <div key={s.num} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-full h-1.5 rounded-full transition-colors ${
                  done ? 'bg-emerald-500' : active ? 'bg-slate-900' : 'bg-slate-200'
                }`} />
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                  done ? 'text-emerald-700' : active ? 'text-slate-900' : 'text-slate-400'
                }`}>
                  {s.num}. {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {infoMessage && step === 2 && (
          <div className="p-3 text-xs rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
            {infoMessage}
          </div>
        )}

        {step === 3 && (
          <div className="p-3 text-xs rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>OTP verified! Choose your new password below.</span>
          </div>
        )}

        {error && (
          <div className="p-3 text-xs rounded-lg bg-red-50 border border-red-200 text-red-700">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
            >
              {loading ? 'Sending Code...' : 'Send Verification Code'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3 text-center">
                Enter 6-Digit Verification Code
              </label>
              <OtpInput
                onComplete={(code) => setOtp(code)}
                onChange={(code) => {
                  setOtp(code);
                  if (error) setError(null);
                }}
                onResend={handleResendOtp}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                loading || otp.length !== 6
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
              }`}
            >
              {loading ? 'Verifying OTP...' : 'Verify OTP & Continue'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Re-enter new password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || newPassword.length < 6 || confirmPassword.length < 6}
              className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                loading || newPassword.length < 6 || confirmPassword.length < 6
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
              }`}
            >
              {loading ? 'Resetting Password...' : 'Save New Password'}
            </button>
          </form>
        )}

        <div className="text-center pt-2 flex items-center justify-center gap-4">
          {step >= 2 && (
            <button
              type="button"
              onClick={resetToEmailStep}
              className="text-xs text-slate-500 hover:text-slate-800 underline transition-colors"
            >
              Change Email
            </button>
          )}
          <Link
            to="/login"
            className="text-xs text-slate-500 hover:text-slate-800 underline transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
