import React, { useState, useEffect, useRef } from 'react';
import { RotateCw } from 'lucide-react';

export const OtpInput = ({
  length = 6,
  value = '',
  onComplete,
  onChange,
  onResend,
  disabled = false,
  error = null,
  cooldownSeconds = 30,
  externalCooldown = 0,
  autoFocus = false,
}) => {
  const [digits, setDigits] = useState(() => {
    const clean = String(value || '').slice(0, length).split('');
    return Array.from({ length }, (_, idx) => clean[idx] || '');
  });
  const [timeLeft, setTimeLeft] = useState(cooldownSeconds);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (value !== undefined && value !== digits.join('')) {
      const clean = String(value || '').slice(0, length).split('');
      setDigits(Array.from({ length }, (_, idx) => clean[idx] || ''));
    }
  }, [value, length]);

  useEffect(() => {
    if (externalCooldown > 0) {
      setTimeLeft((prev) => Math.max(prev, externalCooldown));
    }
  }, [externalCooldown]);

  useEffect(() => {
    if (timeLeft <= 0) return undefined;
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const emitChange = (nextDigits) => {
    setDigits(nextDigits);
    const full = nextDigits.join('');
    onChange?.(full);
    if (full.length === length && !nextDigits.includes('')) {
      onComplete?.(full);
    }
  };

  const handleChange = (e, idx) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw && e.target.value !== '') return;

    if (raw.length > 1) {
      const pasted = raw.slice(0, length).split('');
      const next = Array.from({ length }, (_, i) => pasted[i] || '');
      emitChange(next);
      inputsRef.current[Math.min(pasted.length - 1, length - 1)]?.focus();
      return;
    }

    const next = [...digits];
    next[idx] = raw;
    emitChange(next);

    if (raw && idx < length - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < length - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    const next = Array.from({ length }, (_, idx) => pasted[idx] || '');
    emitChange(next);
    inputsRef.current[Math.min(pasted.length, length) - 1]?.focus();
  };

  const handleResend = () => {
    if (timeLeft > 0 || disabled || !onResend) return;
    setTimeLeft(cooldownSeconds);
    emitChange(Array(length).fill(''));
    inputsRef.current[0]?.focus();
    onResend();
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
        {digits.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => {
              inputsRef.current[idx] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={idx === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            value={digit}
            disabled={disabled}
            autoFocus={autoFocus && idx === 0}
            aria-label={`Verification digit ${idx + 1} of ${length}`}
            aria-invalid={Boolean(error)}
            onChange={(e) => handleChange(e, idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`${
              length <= 4 ? 'w-14 h-14' : 'w-12 h-[52px]'
            } min-h-[52px] text-center font-display text-ds-24 font-extrabold rounded-input border bg-brand-white dark:bg-brand-ink transition-all duration-150 outline-none shadow-card ${
              error
                ? 'border-status-danger text-status-danger focus:ring-2 focus:ring-status-danger/20'
                : digit
                  ? 'border-brand-ink dark:border-brand-yellow text-brand-ink dark:text-brand-yellow bg-brand-yellowSoft/40 dark:bg-brand-yellow/10 focus:ring-2 focus:ring-brand-yellow/30'
                  : 'border-gray-200 dark:border-gray-600/50 text-brand-ink dark:text-brand-white focus:border-brand-ink dark:focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/25'
            } disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed`}
          />
        ))}
      </div>

      {error && (
        <p className="text-ds-12 font-semibold text-status-danger text-center" role="alert">
          {error}
        </p>
      )}

      {onResend && (
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-600/20 text-ds-12 text-gray-600 dark:text-gray-400">
          <span>Didn&apos;t receive a code?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={timeLeft > 0 || disabled}
            className={`inline-flex items-center gap-1.5 min-h-[40px] px-2.5 font-bold rounded-lg transition-colors duration-150 ${
              timeLeft > 0 || disabled
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-brand-ink dark:text-brand-yellow hover:bg-gray-100 dark:hover:bg-gray-900'
            }`}
          >
            <RotateCw className="w-4 h-4" strokeWidth={2} />
            {timeLeft > 0 ? `Resend in ${timeLeft}s` : 'Resend OTP'}
          </button>
        </div>
      )}
    </div>
  );
};

export default OtpInput;
