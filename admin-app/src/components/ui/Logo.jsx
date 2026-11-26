import React from 'react';
import { MapPin } from 'lucide-react';

/**
 * LocalGo brand wordmark with yellow location-pin glyph.
 */
export const Logo = ({
  variant = 'light',
  size = 'md',
  subtitle = null,
  className = '',
}) => {
  const isDarkSurface = variant === 'dark';

  const sizeMap = {
    sm: { box: 'w-8 h-8 rounded-[10px]', pin: 'w-4 h-4', text: 'text-ds-16' },
    md: { box: 'w-10 h-10 rounded-card', pin: 'w-5 h-5', text: 'text-ds-20' },
    lg: { box: 'w-12 h-12 rounded-card', pin: 'w-6 h-6', text: 'text-ds-24' },
  };

  const s = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div
        className={`${s.box} bg-brand-yellow text-brand-ink flex items-center justify-center shadow-card shrink-0`}
        aria-hidden="true"
      >
        <MapPin className={s.pin} strokeWidth={2.4} />
      </div>
      <div className="leading-none">
        <span
          className={`${s.text} font-display font-extrabold tracking-tight ${
            isDarkSurface ? 'text-brand-white' : 'text-brand-ink'
          }`}
        >
          Local<span className={isDarkSurface ? 'text-brand-yellow' : 'text-brand-ink underline decoration-brand-yellow decoration-[3px] underline-offset-4'}>Go</span>
        </span>
        {subtitle && (
          <span
            className={`block text-[10px] font-bold uppercase tracking-widest mt-1 ${
              isDarkSurface ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};

export default Logo;
