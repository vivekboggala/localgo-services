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
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-full shadow-lg border border-slate-700 flex items-center gap-2.5 text-xs font-medium"
    >
      <RotateCw className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
      <span>
        Server is waking up, retrying... (Attempt {wakeState.attempt}/{wakeState.maxRetries})
      </span>
    </div>
  );
};

export default ServerWakeBanner;
