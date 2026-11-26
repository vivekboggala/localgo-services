import React from 'react';
import { ShieldCheck } from 'lucide-react';

const SIZES = {
  sm: 'w-9 h-9 text-ds-12',
  md: 'w-12 h-12 text-ds-16',
  lg: 'w-14 h-14 text-ds-20',
  xl: 'w-16 h-16 text-ds-24',
};

export const Avatar = ({
  src,
  name = 'LocalGo User',
  size = 'md',
  status = null, // 'online' | 'offline' | null
  verified = false,
  tone = 'ink', // 'ink' | 'yellow'
  className = '',
}) => {
  const initials = String(name || 'L')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  const toneClass =
    tone === 'yellow'
      ? 'bg-brand-yellow text-brand-ink border border-brand-yellowHover'
      : 'bg-brand-ink text-brand-white border border-gray-900';

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${SIZES[size] || SIZES.md} rounded-card object-cover border border-gray-200 bg-gray-100`}
        />
      ) : (
        <div
          aria-label={name}
          className={`${SIZES[size] || SIZES.md} rounded-card font-display font-bold flex items-center justify-center shadow-card ${toneClass}`}
        >
          {initials || 'LG'}
        </div>
      )}

      {status && (
        <span
          title={status === 'online' ? 'Online' : 'Offline'}
          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-brand-white ${
            status === 'online' ? 'bg-status-success' : 'bg-gray-400'
          }`}
        />
      )}

      {verified && (
        <span
          title="Verified"
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-brand-yellow text-brand-ink border-2 border-brand-white flex items-center justify-center shadow-card"
        >
          <ShieldCheck className="w-3 h-3" strokeWidth={2.5} />
        </span>
      )}
    </div>
  );
};

export default Avatar;
