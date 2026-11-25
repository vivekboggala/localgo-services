import { useEffect, useRef } from 'react';
import { doc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Keeps views synchronized with live backend state via tab focus/visibility,
 * visible polling, and optional Firestore snapshot listeners.
 */
export const useLiveSync = (
  onRefresh,
  { enabled = true, intervalMs = 10000, providerId = null, watchProviders = false } = {}
) => {
  const refreshRef = useRef(onRefresh);
  refreshRef.current = onRefresh;

  useEffect(() => {
    if (!enabled) return;

    const trigger = () => {
      if (document.visibilityState === 'visible') {
        refreshRef.current?.();
      }
    };

    const interval = setInterval(trigger, intervalMs);
    window.addEventListener('focus', trigger);
    document.addEventListener('visibilitychange', trigger);

    let unsubscribeSnapshot = null;
    let firstSnapshot = true;
    const handleSnap = () => {
      if (firstSnapshot) {
        firstSnapshot = false;
        return;
      }
      refreshRef.current?.();
    };

    if (providerId) {
      try {
        unsubscribeSnapshot = onSnapshot(doc(db, 'providers', String(providerId)), handleSnap, () => {});
      } catch (e) {}
    } else if (watchProviders) {
      try {
        unsubscribeSnapshot = onSnapshot(collection(db, 'providers'), handleSnap, () => {});
      } catch (e) {}
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', trigger);
      document.removeEventListener('visibilitychange', trigger);
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, [enabled, intervalMs, providerId, watchProviders]);
};
