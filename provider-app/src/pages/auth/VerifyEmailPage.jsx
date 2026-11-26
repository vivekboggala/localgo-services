import React, { useState, useContext, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { AuthSplitLayout } from '../../components/auth/AuthSplitLayout';
import { Badge, Button, OtpInput, showToast } from '../../components/ui';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { registerProvider } = useContext(AuthContext);

  const isExistingVerification = searchParams.get('mode') === 'verify-existing';
  const queryEmail = searchParams.get('email') || '';

  const pendingRegistration = useMemo(() => {
    if (location.state?.pendingRegistration) {
      return location.state.pendingRegistration;
    }
    try {
      const saved = sessionStorage.getItem('localgo_pending_registration');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!queryEmail || parsed?.payload?.email === queryEmail.trim().toLowerCase()) {
          return parsed;
        }
      }
    } catch {}
    return null;
  }, [location.state, queryEmail]);

  const email = pendingRegistration?.payload?.email || queryEmail || '';

  const [otp, setOtp] = useState('');
  const [verifiedToken, setVerifiedToken] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const t = setInterval(() => setCooldownLeft((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldownLeft]);

  const handleVerify = async (codeToVerify) => {
    const targetOtp = codeToVerify || otp;
    if (!targetOtp || targetOtp.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    if (!email || (!isExistingVerification && !pendingRegistration)) {
      setError('Registration details are missing. Please restart signup.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let verificationToken = verifiedToken?.otp === targetOtp ? verifiedToken.token : null;
      let existingAccount = false;

      if (!verificationToken) {
        const verifyRes = await api.post('/auth/verify-email', {
          email: email.trim(),
          otp: targetOtp,
          purpose: 'EMAIL_VERIFICATION',
        });

        verificationToken = verifyRes.data?.data?.verificationToken;
        existingAccount = Boolean(verifyRes.data?.data?.existingAccount);
        if (!verifyRes.data?.success || !verificationToken) {
          throw new Error(verifyRes.data?.message || 'OTP verification failed.');
        }
        setVerifiedToken({ otp: targetOtp, token: verificationToken });
      }

      if (isExistingVerification || existingAccount) {
        showToast.success('Email verified successfully! Please sign in.');
        navigate('/login');
        return;
      }

      const registrationPayload = {
        ...pendingRegistration.payload,
        otpVerificationToken: verificationToken,
      };

      const createdUser = await registerProvider(registrationPayload);

      sessionStorage.removeItem('localgo_pending_registration');
      showToast.success('Partner account created!');
      setPendingConfirmation(createdUser || pendingRegistration.payload);
    } catch (err) {
      if (err.response?.status === 429) {
        const retrySec = err.response?.data?.data?.retryAfterSeconds || Number(err.response?.headers?.['retry-after']) || 60;
        setCooldownLeft(retrySec);
      }
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Verification failed. Please check the code and try again.';
      setError(msg);
      showToast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      showToast.error('Email address is missing. Please restart signup.');
      return;
    }
    try {
      await api.post('/auth/resend-otp', {
        email: email.trim(),
        purpose: 'EMAIL_VERIFICATION',
      });
      showToast.success('A new verification code has been sent to your email.');
    } catch (err) {
      if (err.response?.status === 429) {
        const retrySec = err.response?.data?.data?.retryAfterSeconds || Number(err.response?.headers?.['retry-after']) || 60;
        setCooldownLeft(retrySec);
      }
      const msg = err.response?.data?.message || 'Failed to resend code. Please try again later.';
      setError(msg);
      showToast.error(msg);
    }
  };

  // Pending Verification Confirmation Screen after Provider Registration
  if (pendingConfirmation) {
    return (
      <AuthSplitLayout badgeText="Application Submitted">
        <div className="bg-brand-white dark:bg-gray-900 rounded-sheet border border-gray-200 dark:border-gray-600/30 shadow-sheet p-6 sm:p-8 text-center space-y-6 animate-modal-pop">
          <div className="w-20 h-20 rounded-full bg-brand-yellowSoft dark:bg-brand-yellow/15 border-4 border-brand-yellow text-brand-ink dark:text-brand-yellow flex items-center justify-center mx-auto">
            <Clock className="w-10 h-10" strokeWidth={2.2} />
          </div>

          <div className="space-y-2">
            <Badge tone="warning" dot>Pending Verification</Badge>
            <h1 className="font-display font-bold text-ds-24 sm:text-ds-32 text-brand-ink dark:text-brand-white">
              Application Under Review
            </h1>
            <p className="text-ds-14 text-gray-600 dark:text-gray-400 leading-relaxed">
              Your email is verified and your partner profile is queued for admin approval. You can preview Partner Studio now and go online once verified.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-brand-ink rounded-card p-4 border border-gray-200 dark:border-gray-600/30 text-left space-y-2 text-ds-12">
            <div className="flex items-center gap-2 font-bold text-brand-ink dark:text-brand-white">
              <CheckCircle2 className="w-4 h-4 text-status-success" /> Email verified ({email})
            </div>
            <div className="flex items-center gap-2 font-bold text-brand-ink dark:text-brand-white">
              <ShieldCheck className="w-4 h-4 text-brand-yellow" /> Admin verification usually takes a few hours
            </div>
          </div>

          <Button
            variant="accent"
            size="lg"
            fullWidth
            rightIcon={<ArrowRight className="w-5 h-5" />}
            onClick={() => navigate('/dashboard')}
          >
            Go to Partner Dashboard
          </Button>
        </div>
      </AuthSplitLayout>
    );
  }

  if (!email || (!isExistingVerification && !pendingRegistration)) {
    return (
      <AuthSplitLayout badgeText="Partner Verification">
        <div className="bg-brand-white dark:bg-gray-900 rounded-sheet border border-gray-200 dark:border-gray-600/30 shadow-sheet p-6 sm:p-8 space-y-5">
          <div className="space-y-1.5">
            <h1 className="font-display font-bold text-ds-24 text-brand-ink dark:text-brand-white">
              Complete signup first
            </h1>
            <p className="text-ds-14 text-gray-600 dark:text-gray-400">
              Complete partner registration so we can send your verification code.
            </p>
          </div>
          <Button
            variant="accent"
            size="lg"
            fullWidth
            rightIcon={<ArrowRight className="w-5 h-5" />}
            onClick={() => navigate('/signup')}
          >
            Go to Registration
          </Button>
        </div>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout badgeText="Partner Email OTP">
      <div className="bg-brand-white dark:bg-gray-900 rounded-sheet border border-gray-200 dark:border-gray-600/30 shadow-sheet p-6 sm:p-8 space-y-6">
        <div className="space-y-2">
          <h1 className="font-display font-bold text-ds-24 text-brand-ink dark:text-brand-white tracking-tight">
            Verify partner email
          </h1>
          <p className="text-ds-14 text-gray-600 dark:text-gray-400">
            Enter the 6-digit code sent to <span className="font-semibold text-brand-ink dark:text-brand-yellow">{email}</span>
          </p>
        </div>

        <OtpInput
          length={6}
          cooldownSeconds={30}
          externalCooldown={cooldownLeft}
          autoFocus
          onComplete={(code) => handleVerify(code)}
          onChange={(code) => {
            setOtp(code);
            if (error) setError(null);
          }}
          onResend={handleResend}
          disabled={submitting || cooldownLeft > 0}
          error={error}
        />

        {cooldownLeft > 0 && (
          <p className="text-ds-12 font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/30 rounded-card px-3.5 py-2.5 text-center">
            Cooldown active: wait {cooldownLeft}s before trying again.
          </p>
        )}

        <Button
          variant="accent"
          size="lg"
          fullWidth
          loading={submitting}
          disabled={otp.length !== 6 || cooldownLeft > 0}
          rightIcon={<ArrowRight className="w-5 h-5" />}
          onClick={() => handleVerify()}
        >
          {isExistingVerification ? 'Verify Email' : 'Verify & Submit Application'}
        </Button>

        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => navigate(isExistingVerification ? '/login' : '/signup')}
            className="inline-flex items-center gap-1.5 text-ds-12 font-bold text-gray-600 dark:text-gray-400 hover:text-brand-ink dark:hover:text-brand-white"
          >
            <ArrowLeft className="w-4 h-4" />
            {isExistingVerification ? 'Back to Sign In' : 'Back to Registration'}
          </button>
        </div>
      </div>
    </AuthSplitLayout>
  );
};

export default VerifyEmailPage;
