import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Eye, XCircle, RotateCcw, Star, MapPin, ShieldCheck, ArrowRight } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { bookingService } from '../../services/bookingService';
import { BookingCard } from '../../components/customer/BookingCard';
import {
  Avatar,
  Badge,
  Button,
  Chip,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PageHeader,
  SkeletonCard,
  StatusBadge,
  Tabs,
  showToast,
} from '../../components/ui';
import { formatCurrency, getProviderAvatar } from '../../utils/helpers';

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
  const [selectedId, setSelectedId] = useState(null);
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
        setAllBookings((prev) => {
          const prevMap = new Map(prev.map((item) => [item.id, item]));
          const liveList = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            const existing = prevMap.get(docSnap.id);
            const amountInRupees = data.amount != null ? Number(data.amount) / 100 : 0;
            const extraAmount = (data.extraAmountPaise || 0) / 100;
            return {
              id: docSnap.id,
              ...data,
              amount: amountInRupees,
              extraAmount,
              totalAmount: amountInRupees + extraAmount,
              startOtp: data.startOtp ?? existing?.startOtp,
            };
          });

          liveList.sort((a, b) => {
            const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
            const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
            return tB - tA;
          });

          return liveList.length > 0 ? liveList : prev;
        });
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

  const previewBooking = useMemo(
    () => displayedBookings.find((b) => b.id === selectedId) || displayedBookings[0] || null,
    [displayedBookings, selectedId]
  );

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
          setSelectedId(null);
        }}
      />

      {error && allBookings.length === 0 ? (
        <ErrorState message={error} onRetry={loadInitialBookings} />
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
        <>
          {/* Mobile & Tablet Cards (< lg) */}
          <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-5">
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

          {/* Desktop Table + XL Side Preview Panel */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-12 xl:col-span-8 bg-brand-white border border-gray-200 rounded-card shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      <th className="py-3.5 px-5">Service</th>
                      <th className="py-3.5 px-4">Provider</th>
                      <th className="py-3.5 px-4">Date &amp; Time</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Amount</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-ds-14">
                    {displayedBookings.map((b) => {
                      const canCancel = ['REQUESTED', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED'].includes(b.status);
                      const canRebook = ['COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED'].includes(b.status);
                      const isSelected = previewBooking?.id === b.id;
                      return (
                        <tr
                          key={b.id}
                          onClick={() => setSelectedId(b.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-brand-yellowSoft/40' : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className="py-4 px-5">
                            <div className="font-display font-bold text-brand-ink">{b.serviceName}</div>
                            <div className="text-[11px] text-gray-400 font-mono">#{b.id.slice(0, 10)}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2.5">
                              <Avatar src={getProviderAvatar(b.providerName)} name={b.providerName} size="sm" />
                              <span className="font-semibold text-brand-ink truncate max-w-[140px]">{b.providerName}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-ds-12 text-gray-600 whitespace-nowrap">
                            <div className="font-semibold text-brand-ink">{b.scheduledDate}</div>
                            <div>{b.scheduledTime}</div>
                          </td>
                          <td className="py-4 px-4">
                            <StatusBadge status={b.status} />
                          </td>
                          <td className="py-4 px-4 text-right font-display font-bold text-brand-ink whitespace-nowrap">
                            {formatCurrency(b.amount)}
                          </td>
                          <td className="py-4 px-5 text-right">
                            <div className="inline-flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="secondary"
                                onClick={() => navigate(`/bookings/${b.id}`)}
                                leftIcon={<Eye className="w-3.5 h-3.5" />}
                                className="min-h-[36px] py-1 px-2.5 text-ds-12"
                              >
                                View
                              </Button>
                              {canCancel && (
                                <Button
                                  variant="danger"
                                  onClick={() => {
                                    setCancelTarget(b);
                                    setCancelReason('');
                                  }}
                                  className="min-h-[36px] py-1 px-2.5 text-ds-12"
                                  aria-label="Cancel booking"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              {canRebook && (
                                <Button
                                  variant="primary"
                                  onClick={() =>
                                    navigate(`/book/${b.providerId}?serviceId=${b.serviceId}`, {
                                      state: { prefillDescription: b.description, prefillAddress: b.address },
                                    })
                                  }
                                  className="min-h-[36px] py-1 px-2.5 text-ds-12"
                                  title="Rebook"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 text-brand-yellow" />
                                </Button>
                              )}
                              {b.status === 'COMPLETED' && (
                                <Button
                                  variant="accent"
                                  onClick={() => navigate(`/bookings/${b.id}?rate=true`)}
                                  className="min-h-[36px] py-1 px-2.5 text-ds-12"
                                  title="Rate"
                                >
                                  <Star className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* XL Side Detail Preview */}
            {previewBooking && (
              <aside className="hidden xl:block xl:col-span-4 xl:sticky xl:top-24 bg-brand-white border border-gray-200 rounded-sheet p-5 shadow-sheet space-y-4">
                <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-3.5">
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                      Booking Preview
                    </span>
                    <h3 className="font-display font-bold text-ds-16 text-brand-ink truncate mt-0.5">
                      {previewBooking.serviceName}
                    </h3>
                  </div>
                  <StatusBadge status={previewBooking.status} />
                </div>

                <div className="flex items-center gap-3 bg-gray-50 p-3.5 rounded-card border border-gray-100">
                  <Avatar src={getProviderAvatar(previewBooking.providerName)} name={previewBooking.providerName} size="md" />
                  <div className="min-w-0">
                    <div className="font-display font-bold text-ds-14 text-brand-ink truncate">
                      {previewBooking.providerName}
                    </div>
                    <div className="text-ds-12 text-gray-600">
                      {previewBooking.scheduledDate} &bull; {previewBooking.scheduledTime}
                    </div>
                  </div>
                </div>

                {previewBooking.startOtp && ['ACCEPTED', 'ON_THE_WAY', 'ARRIVED'].includes(previewBooking.status) && (
                  <div className="bg-brand-ink text-brand-white rounded-card p-3.5 flex items-center justify-between">
                    <span className="text-ds-12 font-semibold inline-flex items-center gap-1.5 text-gray-300">
                      <ShieldCheck className="w-4 h-4 text-brand-yellow" /> Start OTP
                    </span>
                    <span className="font-display font-extrabold text-ds-20 text-brand-yellow tracking-widest">
                      {previewBooking.startOtp}
                    </span>
                  </div>
                )}

                <div className="space-y-1.5 text-ds-12">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount</span>
                    <span className="font-display font-bold text-brand-ink">
                      {formatCurrency(previewBooking.amount)} ({previewBooking.paymentMethod})
                    </span>
                  </div>
                  {previewBooking.address && (
                    <div className="pt-2 border-t border-gray-100">
                      <span className="text-gray-600 inline-flex items-center gap-1 mb-0.5">
                        <MapPin className="w-3.5 h-3.5" /> Address
                      </span>
                      <p className="font-medium text-brand-ink">{previewBooking.address}</p>
                    </div>
                  )}
                </div>

                <Button
                  variant="accent"
                  fullWidth
                  onClick={() => navigate(`/bookings/${previewBooking.id}`)}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Open Full Tracking Page
                </Button>
              </aside>
            )}
          </div>
        </>
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
