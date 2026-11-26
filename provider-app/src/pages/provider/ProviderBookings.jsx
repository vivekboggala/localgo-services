import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { RotateCw, Calendar, MapPin, User, ArrowRight, Search, X } from 'lucide-react';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { providerPortalService } from '../../services/providerPortalService';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  SkeletonList,
  StatusBadge,
  Tabs,
} from '../../components/ui';
import { formatCurrency } from '../../utils/helpers';

const TERMINATED_STATUSES = ['CANCELLED', 'REJECTED', 'EXPIRED'];

export const ProviderBookings = () => {
  const { user, firebaseUser } = useAuth();
  const uid = firebaseUser?.uid || user?.id;
  const navigate = useNavigate();

  const [allBookings, setAllBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBookings = () => {
    setLoading(true);
    setError('');
    providerPortalService.getProviderBookings(null, 0, 100)
      .then((data) => setAllBookings(Array.isArray(data) ? data : (data?.content || [])))
      .catch((err) => {
        setAllBookings([]);
        setError(err.response?.data?.message || 'Unable to load booking history.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!uid) {
      setAllBookings([]);
      setLoading(false);
      return undefined;
    }

    fetchBookings();

    const q = query(collection(db, 'bookings'), where('providerId', '==', uid));
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

        setAllBookings(liveList);
        setLoading(false);
      },
      (err) => console.warn('Real-time provider bookings listener error:', err)
    );

    return () => unsubscribe();
  }, [uid]);

  const tabsWithCounts = useMemo(
    () => [
      { key: 'ALL', label: 'All', count: allBookings.length },
      { key: 'COMPLETED', label: 'Completed', count: allBookings.filter((b) => b.status === 'COMPLETED').length },
      {
        key: 'CANCELLED',
        label: 'Cancelled',
        count: allBookings.filter((b) => TERMINATED_STATUSES.includes(b.status)).length,
      },
    ],
    [allBookings]
  );

  const displayedBookings = useMemo(() => {
    let list = allBookings;
    if (activeTab === 'COMPLETED') {
      list = list.filter((b) => b.status === 'COMPLETED');
    } else if (activeTab === 'CANCELLED') {
      list = list.filter((b) => TERMINATED_STATUSES.includes(b.status));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.serviceName?.toLowerCase().includes(q) ||
          b.customerName?.toLowerCase().includes(q) ||
          b.address?.toLowerCase().includes(q) ||
          String(b.id).toLowerCase().includes(q)
      );
    }
    return list;
  }, [allBookings, activeTab, searchQuery]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <PageHeader
        title="Job History"
        subtitle="Review completed payouts, cancellations, and trip receipts"
        actions={
          <Button
            variant="secondary"
            onClick={fetchBookings}
            leftIcon={<RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            className="min-h-[44px] py-2 px-3.5 text-ds-12"
          >
            Refresh
          </Button>
        }
      />

      <div className="space-y-3">
        <Tabs tabs={tabsWithCounts} activeTab={activeTab} onChange={setActiveTab} />

        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by customer, service, address, or ID..."
          aria-label="Search booking history"
          leftIcon={<Search className="w-5 h-5" />}
          rightElement={
            searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="w-9 h-9 rounded-pill hover:bg-gray-100 dark:hover:bg-gray-900 flex items-center justify-center text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null
          }
        />
      </div>

      {error && allBookings.length === 0 ? (
        <ErrorState message={error} onRetry={fetchBookings} />
      ) : loading ? (
        <SkeletonList count={4} />
      ) : displayedBookings.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-7 h-7" />}
          title="No jobs match this filter"
          description="Try clearing your search or switching tabs."
          actionLabel={searchQuery || activeTab !== 'ALL' ? 'Reset Filters' : null}
          onAction={
            searchQuery || activeTab !== 'ALL'
              ? () => {
                  setSearchQuery('');
                  setActiveTab('ALL');
                }
              : null
          }
        />
      ) : (
        <div className="space-y-3">
          {displayedBookings.map((b) => (
            <div
              key={b.id}
              onClick={() => navigate(`/jobs/${b.id}`)}
              className="bg-brand-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600/30 hover:border-brand-yellow rounded-card p-4 sm:p-5 shadow-card cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-mono text-gray-400">#{b.id}</span>
                  <h2 className="font-display font-bold text-ds-16 text-brand-ink dark:text-brand-white">
                    {b.serviceName}
                  </h2>
                  <StatusBadge status={b.status} />
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-ds-12 text-gray-600 dark:text-gray-200 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-brand-yellow" /> {b.customerName}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-brand-yellow" /> {b.scheduledDate} {b.scheduledTime}
                  </span>
                </div>

                <div className="flex items-start gap-1.5 text-ds-12 text-gray-600 dark:text-gray-400">
                  <MapPin className="w-3.5 h-3.5 text-brand-yellow shrink-0 mt-0.5" />
                  <span className="truncate">{b.address}</span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-600/20 shrink-0">
                <div className="text-left sm:text-right">
                  <div className="font-display font-extrabold text-ds-20 text-brand-ink dark:text-brand-yellow">
                    {formatCurrency(b.amount)}
                  </div>
                  <Badge tone={b.paymentStatus === 'PAID' ? 'success' : 'neutral'} className="mt-0.5 text-[10px] py-0.5 px-2">
                    {b.paymentMethod} • {b.paymentStatus || 'PENDING'}
                  </Badge>
                </div>

                <ArrowRight className="w-5 h-5 text-brand-yellow shrink-0" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
