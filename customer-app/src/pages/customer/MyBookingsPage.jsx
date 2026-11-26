import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Calendar, Search } from 'lucide-react';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { bookingService } from '../../services/bookingService';
import { BookingCard } from '../../components/customer/BookingCard';
import {
  Chip,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PageHeader,
  SkeletonCard,
  Tabs,
  showToast,
} from '../../components/ui';

const TAB_GROUPS = [
  { key: 'UPCOMING', label: 'Upcoming', statuses: ['REQUESTED', 'ACCEPTED'] },
  { key: 'ACTIVE', label: 'Active', statuses: ['ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS'] },
  { key: 'COMPLETED', label: 'Completed', statuses: ['COMPLETED'] },
  { key: 'CANCELLED', label: 'Cancelled', statuses: ['CANCELLED', 'REJECTED', 'EXPIRED'] },
];

const CANCEL_REASONS = [
  'Booked by mistake',
  'Provider taking too long',
  'Found another professional',
  'Schedule changed',
];

export const MyBookingsPage = () => {
  const { user, firebaseUser } = useAuth();
  const uid = firebaseUser?.uid || user?.id;
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('UPCOMING');
  const [hasUserPickedTab, setHasUserPickedTab] = useState(false);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Quick cancel dialog state
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const loadInitialBookings = () => {
    if (!uid) {
      setAllBookings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    bookingService.getMyBookings()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.content || []);
        setAllBookings(list);
      })
      .catch((err) => {
        console.warn('Initial REST load error for my bookings:', err);
        setError(err.response?.data?.message || 'Unable to load bookings right now.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInitialBookings();
    if (!uid) return undefined;

    const q = query(collection(db, 'bookings'), where('customerId', '==', uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const liveList = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const amountInRupees = data.amount != null ? Number(data.amount) / 100 : 0;
          return { id: docSnap.id, ...data, amount: amountInRupees };
        });

        liveList.sort((a, b) => {
          const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
          const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
          return tB - tA;
        });

        if (liveList.length > 0) {
          setAllBookings(liveList);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Real-time bookings listener error:', err);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  useEffect(() => {
    if (hasUserPickedTab || allBookings.length === 0) return;
    const priorityOrder = ['ACTIVE', 'UPCOMING', 'COMPLETED', 'CANCELLED'];
    const firstNonEmpty = priorityOrder.find((key) => {
      const grp = TAB_GROUPS.find((t) => t.key === key);
      return allBookings.some((b) => grp.statuses.includes(b.status));
    });
    if (firstNonEmpty) setActiveTab(firstNonEmpty);
  }, [allBookings, hasUserPickedTab]);

  const tabsWithCounts = useMemo(
    () =>
      TAB_GROUPS.map((g) => ({
        key: g.key,
        label: g.label,
        count: allBookings.filter((b) => g.statuses.includes(b.status)).length,
      })),
    [allBookings]
  );

  const displayedBookings = useMemo(() => {
    const grp = TAB_GROUPS.find((g) => g.key === activeTab) || TAB_GROUPS[0];
    return allBookings.filter((b) => grp.statuses.includes(b.status));
  }, [allBookings, activeTab]);

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const updated = await bookingService.cancelBooking(cancelTarget.id, cancelReason || 'Cancelled by customer');
      setAllBookings((prev) => prev.map((b) => (b.id === cancelTarget.id ? { ...b, ...updated } : b)));
      showToast.success('Booking cancelled');
      setCancelTarget(null);
      setCancelReason('');
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Could not cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <PageHeader
        title="My Bookings"
        subtitle="Real-time status tracking and booking history"
      />

      <Tabs
        tabs={tabsWithCounts}
        activeTab={activeTab}
        onChange={(next) => {
          setHasUserPickedTab(true);
          setActiveTab(next);
        }}
      />

      {error && allBookings.length === 0 ? (
        <ErrorState message={error} onRetry={loadInitialBookings} />
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : displayedBookings.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-7 h-7" strokeWidth={2} />}
          title={`No ${activeTab.toLowerCase()} bookings`}
          description="Book a verified service professional nearby and track every step live."
          actionLabel="Explore Services"
          actionVariant="accent"
          onAction={() => navigate('/services')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onCancelRequest={(b) => {
                setCancelTarget(b);
                setCancelReason('');
              }}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancel Booking?"
        message={`Tell us why you want to cancel ${cancelTarget?.serviceName || 'this booking'}:`}
        confirmLabel="Confirm Cancel"
        cancelLabel="Keep Booking"
        variant="danger"
        loading={cancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelTarget(null)}
      >
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {CANCEL_REASONS.map((r) => (
              <Chip
                key={r}
                selected={cancelReason === r}
                tone="ink"
                onClick={() => setCancelReason(r)}
              >
                {r}
              </Chip>
            ))}
          </div>
          <textarea
            rows={2}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Optional details..."
            className="w-full p-3 rounded-input border border-gray-200 focus:border-brand-ink outline-none text-ds-12 text-brand-ink"
          />
        </div>
      </ConfirmDialog>
    </div>
  );
};
