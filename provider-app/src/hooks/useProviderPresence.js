import { useState, useEffect, useCallback } from 'react';
import { providerPortalService } from '../services/providerPortalService';

export const PROVIDER_AVAILABILITY_EVENT = 'localgo:provider-availability';
const ONLINE_SINCE_KEY = 'localgo_provider_online_since';

const syncOnlineSince = (isOnline) => {
  try {
    if (isOnline) {
      const existing = localStorage.getItem(ONLINE_SINCE_KEY);
      if (!existing) {
        localStorage.setItem(ONLINE_SINCE_KEY, String(Date.now()));
      }
      return Number(localStorage.getItem(ONLINE_SINCE_KEY)) || Date.now();
    } else {
      localStorage.removeItem(ONLINE_SINCE_KEY);
      return null;
    }
  } catch {
    return isOnline ? Date.now() : null;
  }
};

export const dispatchAvailabilityChange = (available) => {
  const since = syncOnlineSince(available);
  window.dispatchEvent(new CustomEvent(PROVIDER_AVAILABILITY_EVENT, { detail: { available, onlineSince: since } }));
};

export const formatOnlineDuration = (sinceMs) => {
  if (!sinceMs) return '0m';
  const minsTotal = Math.max(0, Math.floor((Date.now() - sinceMs) / 60000));
  const hrs = Math.floor(minsTotal / 60);
  const mins = minsTotal % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
};

/**
 * Keeps Provider Studio online presence synced via heartbeats while keeping manual offline pauses intact.
 */
export const useProviderPresence = (enabled) => {
  const [available, setAvailable] = useState(null);
  const [onlineSince, setOnlineSince] = useState(() => {
    try {
      const val = localStorage.getItem(ONLINE_SINCE_KEY);
      return val ? Number(val) : null;
    } catch {
      return null;
    }
  });
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
      setOnlineSince(null);
      return;
    }

    sendHeartbeat();

    const interval = setInterval(() => {
      sendHeartbeat();
    }, 25000);

    const handleResume = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    };

    const handleSync = (e) => {
      if (typeof e.detail?.available === 'boolean') {
        setAvailable(e.detail.available);
        setOnlineSince(e.detail.onlineSince ?? null);
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

  const toggleAvailability = useCallback(async (forceState = null) => {
    if (updating) return null;
    setUpdating(true);
    try {
      const target =
        typeof forceState === 'boolean'
          ? forceState
          : typeof available === 'boolean'
            ? !available
            : null;
      const next = await providerPortalService.toggleAvailability(target);
      setAvailable(next);
      dispatchAvailabilityChange(next);
      return next;
    } finally {
      setUpdating(false);
    }
  }, [available, updating]);

  return { available, onlineSince, updating, toggleAvailability, sendHeartbeat };
};
