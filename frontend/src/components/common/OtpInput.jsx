import React, { useState, useEffect, useRef } from 'react';
import { RotateCw } from 'lucide-react';

const OtpInput = ({
  length = 6,
  onComplete,
  onChange,
  onResend,
  disabled = false,
  error = null,
  cooldownSeconds = 30
}) => {
  const [otp, setOtp] = useState(Array(length).fill(''));
  const [timeLeft, setTimeLeft] = useState(cooldownSeconds);
  const inputsRef = useRef([]);

  useEffect(() => {
    let timer;
    if (timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleChange = (e, index) => {
    const val = e.target.value;
    if (!/^\d*$/.test(val)) return;

    const newOtp = [...otp];
    // Take last entered character if length > 1
    newOtp[index] = val.substring(val.length - 1);
    setOtp(newOtp);

    const fullCode = newOtp.join('');
    if (onChange) onChange(fullCode);

    if (val && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    if (fullCode.length === length && !newOtp.includes('')) {
      if (onComplete) onComplete(fullCode);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      if (onChange) onChange(pastedData);
      if (onComplete) onComplete(pastedData);
      inputsRef.current[length - 1]?.focus();
    }
  };

  const handleResendClick = () => {
    if (timeLeft === 0 && onResend) {
      setTimeLeft(cooldownSeconds);
      setOtp(Array(length).fill(''));
      inputsRef.current[0]?.focus();
      onResend();
    }
  };

  return (
    <div className="w-full flex flex-col items-center space-y-4">
      <div className="flex items-center gap-2 sm:gap-3" onPaste={handlePaste}>
        {otp.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => (inputsRef.current[idx] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(e, idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            disabled={disabled}
            className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-lg border bg-white shadow-sm transition-all outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 ${
              error ? 'border-red-500 text-red-600 focus:ring-red-500' : 'border-slate-300 text-slate-900'
            } ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
            autoFocus={idx === 0}
          />
        ))}
      </div>

      {error && <p className="text-xs font-medium text-red-600 text-center">{error}</p>}

      <div className="flex items-center justify-between w-full text-xs text-slate-500 pt-2 border-t border-slate-100">
        <span>Didn't receive the code?</span>
        <button
          type="button"
          onClick={handleResendClick}
          disabled={timeLeft > 0 || disabled}
          className={`flex items-center gap-1.5 font-semibold transition-colors ${
            timeLeft > 0 || disabled
              ? 'text-slate-400 cursor-not-allowed'
              : 'text-slate-900 hover:text-slate-700 underline cursor-pointer'
          }`}
        >
          <RotateCw className={`w-3.5 h-3.5 ${timeLeft > 0 ? 'animate-spin' : ''}`} />
          {timeLeft > 0 ? `Resend code in ${timeLeft}s` : 'Resend OTP'}
        </button>
      </div>
    </div>
  );
};

export default OtpInput;
