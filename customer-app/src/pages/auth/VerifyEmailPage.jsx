import React, { useState, useContext, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { AuthSplitLayout } from '../../components/auth/AuthSplitLayout';
import { Button, OtpInput, showToast } from '../../components/ui';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { registerCustomer } = useContext(AuthContext);

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

      await registerCustomer(registrationPayload);

      sessionStorage.removeItem('localgo_pending_registration');
      showToast.success('Email verified and account created! Welcome to LocalGo.');
      navigate('/dashboard');
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

  if (!email || (!isExistingVerification && !pendingRegistration)) {
    return (
      <AuthSplitLayout badgeText="Email Verification">
        <div className="bg-brand-white rounded-sheet border border-gray-200 shadow-sheet p-6 sm:p-8 text-center space-y-5">
          <div className="w-14 h-14 rounded-sheet bg-brand-yellowSoft border border-brand-yellow text-brand-ink flex items-center justify-center mx-auto">
            <Mail className="w-7 h-7" strokeWidth={2} />
          </div>
          <div className="space-y-1.5">
            <h1 className="font-display font-bold text-ds-24 text-brand-ink">Complete Signup First</h1>
            <p className="text-ds-14 text-gray-600">
              Fill out registration so we can send a 6-digit verification code to your email.
            </p>
          </div>
          <Button
            variant="accent"
            size="lg"
            fullWidth
            rightIcon={<ArrowRight className="w-5 h-5" strokeWidth={2.2} />}
            onClick={() => navigate('/signup')}
          >
            Go to Sign Up
          </Button>
        </div>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout badgeText="OTP Verification">
      <div className="bg-brand-white rounded-sheet border border-gray-200 shadow-sheet p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-sheet bg-brand-yellowSoft border border-brand-yellow text-brand-ink flex items-center justify-center mx-auto">
            <Mail className="w-7 h-7" strokeWidth={2} />
          </div>
          <h1 className="font-display font-bold text-ds-24 text-brand-ink tracking-tight">
            Verify your email
          </h1>
          <p className="text-ds-14 text-gray-600">
            Enter the 6-digit verification code sent to
          </p>
          <span className="inline-block px-3.5 py-1.5 rounded-pill bg-gray-100 border border-gray-200 text-ds-12 font-bold text-brand-ink">
            {email}
          </span>
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
          <p className="text-ds-12 font-semibold text-amber-900 bg-amber-50 border border-amber-200 rounded-card px-3.5 py-2.5 text-center">
            Cooldown active: wait {cooldownLeft}s before trying again.
          </p>
        )}

        <Button
          variant="accent"
          size="lg"
          fullWidth
          loading={submitting}
          disabled={otp.length !== 6 || cooldownLeft > 0}
          rightIcon={<ArrowRight className="w-5 h-5" strokeWidth={2.2} />}
          onClick={() => handleVerify()}
        >
          {isExistingVerification ? 'Verify Email' : 'Verify & Create Account'}
        </Button>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => navigate(isExistingVerification ? '/login' : '/signup')}
            className="inline-flex items-center gap-1.5 text-ds-12 font-bold text-gray-600 hover:text-brand-ink"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
            {isExistingVerification ? 'Back to Sign In' : 'Back to Sign Up'}
          </button>
        </div>
      </div>
    </AuthSplitLayout>
  );
};

export default VerifyEmailPage;
