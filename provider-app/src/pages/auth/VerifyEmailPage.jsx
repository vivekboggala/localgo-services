import React, { useState, useContext, useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import OtpInput from '../../components/common/OtpInput';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { registerCustomer, registerProvider } = useContext(AuthContext);

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
    } catch (e) {}
    return null;
  }, [location.state, queryEmail]);

  const email = pendingRegistration?.payload?.email || queryEmail || '';

  const [otp, setOtp] = useState('');
  const [verifiedToken, setVerifiedToken] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

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
        toast.success('Email verified successfully! Please sign in.');
        navigate('/login');
        return;
      }

      const registrationPayload = {
        ...pendingRegistration.payload,
        otpVerificationToken: verificationToken,
      };

      if (pendingRegistration.role === 'PROVIDER') {
        await registerProvider(registrationPayload);
      } else {
        await registerCustomer(registrationPayload);
      }

      sessionStorage.removeItem('localgo_pending_registration');
      toast.success('Email verified and account created! Welcome to LocalGo Partner Portal.');
      navigate('/dashboard');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Verification failed. Please check the code and try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Email address is missing. Please restart signup.');
      return;
    }
    try {
      await api.post('/auth/resend-otp', {
        email: email.trim(),
        purpose: 'EMAIL_VERIFICATION',
      });
      toast.success('A new verification code has been sent to your email.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend code. Please try again later.';
      toast.error(msg);
    }
  };

  if (!email || (!isExistingVerification && !pendingRegistration)) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50">
        <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-5 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center mx-auto">
            <Mail className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Complete Signup First</h1>
          <p className="text-sm text-slate-600">
            Please fill out the registration form so we can send a 6-digit verification code to your email before creating your account.
          </p>
          <Link
            to="/signup"
            className="inline-flex w-full py-3 px-4 rounded-lg font-medium bg-slate-900 text-white hover:bg-slate-800 items-center justify-center gap-2 transition-all"
          >
            Go to Sign Up
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Verify Your Email</h1>
          <p className="text-sm text-slate-600">
            We sent a 6-digit verification code to
          </p>
          <p className="text-sm font-semibold text-slate-900 bg-slate-100 py-1.5 px-3 rounded-md inline-block">
            {email}
          </p>
        </div>

        <div className="py-2">
          <OtpInput
            onComplete={(code) => handleVerify(code)}
            onChange={(code) => {
              setOtp(code);
              if (error) setError(null);
            }}
            onResend={handleResend}
            disabled={submitting}
            error={error}
          />
        </div>

        <button
          type="button"
          onClick={() => handleVerify()}
          disabled={submitting || otp.length !== 6}
          className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
            submitting || otp.length !== 6
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
          }`}
        >
          {submitting
            ? (isExistingVerification ? 'Verifying Email...' : 'Verifying & Creating Account...')
            : (isExistingVerification ? 'Verify Email' : 'Verify Email & Create Account')}
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate(isExistingVerification ? '/login' : '/signup')}
            className="text-xs text-slate-500 hover:text-slate-800 underline transition-colors"
          >
            {isExistingVerification ? 'Back to Sign In' : 'Back to Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
