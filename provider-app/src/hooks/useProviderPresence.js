import { useState, useEffect, useCallback } from 'react';
import { providerPortalService } from '../services/providerPortalService';

export const PROVIDER_AVAILABILITY_EVENT = 'localgo:provider-availability';

export const dispatchAvailabilityChange = (available) => {
  window.dispatchEvent(new CustomEvent(PROVIDER_AVAILABILITY_EVENT, { detail: { available } }));
};

/**
 * Keeps Provider Studio online presence synced via heartbeats while keeping manual offline pauses intact.
 */
export const useProviderPresence = (enabled) => {
  const [available, setAvailable] = useState(null);
  const [updating, setUpdating] = useState(false);

  const sendHeartbeat = useCallback(async () => {
    if (!enabled) return;
    try {
      const next = await providerPortalService.updatePresence(true, false);
      setAvailable(next);
      dispatchAvailabilityChange(next);
    } catch (err) {
      console.warn('Presence heartbeat failed:', err);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setAvailable(null);
      return;
    }

    sendHeartbeat();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    }, 20000);

    const handleResume = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    };

    const handleSync = (e) => {
      if (typeof e.detail?.available === 'boolean') {
        setAvailable(e.detail.available);
      }
    };

    window.addEventListener('focus', handleResume);
    document.addEventListener('visibilitychange', handleResume);
    window.addEventListener(PROVIDER_AVAILABILITY_EVENT, handleSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleResume);
      document.removeEventListener('visibilitychange', handleResume);
      window.removeEventListener(PROVIDER_AVAILABILITY_EVENT, handleSync);
    };
  }, [enabled, sendHeartbeat]);

  const toggleAvailability = useCallback(async () => {
    if (updating) return null;
    setUpdating(true);
    try {
      const target = typeof available === 'boolean' ? !available : null;
      const next = await providerPortalService.toggleAvailability(target);
      setAvailable(next);
      dispatchAvailabilityChange(next);
      return next;
    } finally {
      setUpdating(false);
    }
  }, [available, updating]);

  return { available, updating, toggleAvailability, sendHeartbeat };
};
