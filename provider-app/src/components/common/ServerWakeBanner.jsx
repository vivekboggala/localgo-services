import React, { useState, useEffect } from 'react';
import { RotateCw } from 'lucide-react';

export const ServerWakeBanner = () => {
  const [wakeState, setWakeState] = useState({ waking: false, attempt: 0, maxRetries: 3 });

  useEffect(() => {
    const handler = (event) => {
      if (event?.detail) {
        setWakeState(event.detail);
      }
    };
    window.addEventListener('localgo:server-waking', handler);
    return () => window.removeEventListener('localgo:server-waking', handler);
  }, []);

  if (!wakeState.waking) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-brand-white px-4 py-2.5 rounded-pill shadow-sheet border border-brand-yellow/40 flex items-center gap-2.5 text-ds-12 font-bold whitespace-nowrap"
    >
      <RotateCw className="w-4 h-4 text-brand-yellow animate-spin shrink-0" strokeWidth={2.5} />
      <span>
        Server waking up, retrying... ({wakeState.attempt}/{wakeState.maxRetries})
      </span>
    </div>
  );
};

export default ServerWakeBanner;
