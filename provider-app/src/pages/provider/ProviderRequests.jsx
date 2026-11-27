import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Inbox, RotateCw, Volume2, VolumeX } from 'lucide-react';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { useProviderPresence } from '../../hooks/useProviderPresence';
import { providerPortalService } from '../../services/providerPortalService';
import { RequestCard } from '../../components/provider/RequestCard';
import {
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  SkeletonList,
  showToast,
} from '../../components/ui';

const playAlertTone = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.setValueAtTime(880, now + 0.14);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.36);
  } catch {}
};

export const ProviderRequests = () => {
  const { user, firebaseUser } = useAuth();
  const uid = firebaseUser?.uid || user?.id;
  const navigate = useNavigate();
  const { available, toggleAvailability } = useProviderPresence(Boolean(uid));

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem('localgo_provider_mute') === 'true';
    } catch {
      return false;
    }
  });

  const knownIdsRef = useRef(new Set());
  const firstSnapshotRef = useRef(true);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  const toggleMute = () => {
    setMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('localgo_provider_mute', String(next));
      } catch {}
      showToast.info(next ? 'Request alert sound muted' : 'Request alert sound enabled');
      return next;
    });
  };

  const fetchRequests = () => {
    setLoading(true);
    setError('');
    providerPortalService.getPendingRequests()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.content || []);
        setRequests(list);
        list.forEach((r) => knownIdsRef.current.add(r.id));
      })
      .catch((err) => {
        setRequests([]);
        setError(err.response?.data?.message || 'Unable to load pending requests.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!uid) {
      setRequests([]);
      setLoading(false);
      return undefined;
    }

    fetchRequests();

    const q = query(
      collection(db, 'bookings'),
      where('providerId', '==', uid),
      where('status', '==', 'REQUESTED')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setRequests((prev) => {
          const prevMap = new Map(prev.map((item) => [item.id, item]));
          const liveRequests = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            const existing = prevMap.get(docSnap.id);
            const amountInRupees = data.amount != null ? Number(data.amount) / 100 : 0;
            return {
              id: docSnap.id,
              ...data,
              amount: amountInRupees,
              distanceKm: data.distanceKm ?? existing?.distanceKm,
            };
          });

          const hasNewRequest = liveRequests.some((r) => !knownIdsRef.current.has(r.id));
          if (!firstSnapshotRef.current && hasNewRequest && !mutedRef.current) {
            playAlertTone();
            try {
              navigator.vibrate?.([200, 100, 200]);
            } catch {}
            showToast.info('New service request received!');
          }
          firstSnapshotRef.current = false;
          liveRequests.forEach((r) => knownIdsRef.current.add(r.id));

          return liveRequests;
        });
        setLoading(false);
      },
      (err) => {
        console.warn('Real-time provider requests listener error:', err);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  const handleOpen = (id) => {
    navigate(`/jobs/${id}`);
  };

  const handleAccept = async (id) => {
    try {
      await providerPortalService.updateBookingStatus(id, 'ACCEPTED');
      window.dispatchEvent(new Event('localgo:requests-updated'));
      showToast.success('Request accepted! Opening job screen...');
      navigate(`/jobs/${id}`);
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Accept request failed.');
    }
  };

  const handleReject = async (id) => {
    try {
      await providerPortalService.updateBookingStatus(id, 'REJECTED');
      window.dispatchEvent(new Event('localgo:requests-updated'));
      showToast.success('Request rejected.');
      fetchRequests();
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Reject request failed.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incoming Requests"
        subtitle="Accept within 10 minutes before auto-expiry"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={toggleMute}
              leftIcon={muted ? <VolumeX className="w-4 h-4 text-status-danger" /> : <Volume2 className="w-4 h-4 text-brand-yellow" />}
              className="min-h-[44px] py-2 px-3.5 text-ds-12"
            >
              {muted ? 'Muted' : 'Sound On'}
            </Button>
            <Button
              variant="secondary"
              onClick={fetchRequests}
              leftIcon={<RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
              className="min-h-[44px] py-2 px-3.5 text-ds-12"
            >
              Refresh
            </Button>
          </div>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={fetchRequests} />
      ) : loading ? (
        <SkeletonList count={3} />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<Inbox className="w-7 h-7" strokeWidth={2} />}
          title={available ? "You're online, waiting for requests" : 'You are currently offline'}
          description={
            available
              ? 'Stay on duty — nearby requests with countdown timers will appear automatically.'
              : 'Go online so nearby customers can send doorstep requests to you.'
          }
          actionLabel={!available ? 'Go Online Now' : null}
          actionVariant="accent"
          onAction={!available ? () => toggleAvailability(true) : null}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {requests.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              onOpen={handleOpen}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  );
};
