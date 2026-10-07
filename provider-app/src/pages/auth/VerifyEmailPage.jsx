import React, { useState, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import OtpInput from '../../components/common/OtpInput';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const navigate = useNavigate();
  const { handleAuthSuccess } = useContext(AuthContext);

  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleVerify = async (codeToVerify) => {
    const targetOtp = codeToVerify || otp;
    if (!targetOtp || targetOtp.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.post('/auth/verify-email', {
        email,
        otp: targetOtp,
        purpose: 'EMAIL_VERIFICATION',
      });

      if (res.data.success) {
        toast.success('Email verified successfully!');
        if (handleAuthSuccess) {
          handleAuthSuccess(res.data.data.token, res.data.data.user);
        } else {
          localStorage.setItem('localgo_token', res.data.data.token);
          localStorage.setItem('localgo_user', JSON.stringify(res.data.data.user));
        }

        const role = res.data.data.user?.role;
        if (role === 'ADMIN') navigate('/admin');
        else if (role === 'PROVIDER') navigate('/provider');
        else navigate('/');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed. Please check the code and try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.post('/auth/resend-otp', {
        email,
        purpose: 'EMAIL_VERIFICATION',
      });
      toast.success('A new verification code has been sent to your email.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend code. Please try again later.';
      toast.error(msg);
    }
  };

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
            {email || 'your registered email'}
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
          {submitting ? 'Verifying...' : 'Verify Email'}
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-xs text-slate-500 hover:text-slate-800 underline transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
