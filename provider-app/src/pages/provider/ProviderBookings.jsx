import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import {
  RotateCw,
  Calendar,
  MapPin,
  User,
  ArrowRight,
  Search,
  X,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
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
  Select,
  SkeletonList,
  StatusBadge,
  Tabs,
} from '../../components/ui';
import { formatCurrency } from '../../utils/helpers';

const TERMINATED_STATUSES = ['CANCELLED', 'REJECTED', 'EXPIRED'];
const PAGE_SIZE = 15;

export const ProviderBookings = () => {
  const { user, firebaseUser } = useAuth();
  const uid = firebaseUser?.uid || user?.id;
  const navigate = useNavigate();

  const [allBookings, setAllBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [page, setPage] = useState(0);
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

  useEffect(() => {
    setPage(0);
  }, [activeTab, searchQuery, sortBy]);

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
    let list = [...allBookings];
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

    list.sort((a, b) => {
      if (sortBy === 'amount_desc') return (Number(b.amount) || 0) - (Number(a.amount) || 0);
      if (sortBy === 'amount_asc') return (Number(a.amount) || 0) - (Number(b.amount) || 0);
      const da = `${a.scheduledDate || ''}T${a.scheduledTime || ''}`;
      const dbStr = `${b.scheduledDate || ''}T${b.scheduledTime || ''}`;
      return sortBy === 'date_asc' ? da.localeCompare(dbStr) : dbStr.localeCompare(da);
    });

    return list;
  }, [allBookings, activeTab, searchQuery, sortBy]);

  const totalPages = Math.max(1, Math.ceil(displayedBookings.length / PAGE_SIZE));
  const pagedBookings = useMemo(
    () => displayedBookings.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [displayedBookings, page]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Job History"
        subtitle="Filter, sort, and inspect completed payouts, cancellations, and receipts"
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

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <Tabs tabs={tabsWithCounts} activeTab={activeTab} onChange={setActiveTab} />

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 lg:max-w-xl">
          <div className="flex-1">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer, service, address, or ID..."
              aria-label="Search booking history"
              leftIcon={<Search className="w-4 h-4" />}
              rightElement={
                searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="w-9 h-9 rounded-pill hover:bg-gray-100 dark:hover:bg-gray-900 flex items-center justify-center text-gray-400 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : null
              }
            />
          </div>
          <div className="sm:w-48">
            <Select
              aria-label="Sort bookings"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={[
                { value: 'date_desc', label: 'Newest Date' },
                { value: 'date_asc', label: 'Oldest Date' },
                { value: 'amount_desc', label: 'Amount High-Low' },
                { value: 'amount_asc', label: 'Amount Low-High' },
              ]}
            />
          </div>
        </div>
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
        <>
          {/* Mobile Cards (< lg) */}
          <div className="lg:hidden space-y-3">
            {pagedBookings.map((b) => (
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

          {/* Desktop Data Table (lg+) */}
          <div className="hidden lg:block bg-brand-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600/25 rounded-card shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-brand-ink/80 border-b border-gray-200 dark:border-gray-600/25">
                  <tr className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <th className="py-3.5 px-5">
                      <button
                        type="button"
                        onClick={() => setSortBy((s) => (s === 'date_desc' ? 'date_asc' : 'date_desc'))}
                        className="inline-flex items-center gap-1 hover:text-brand-yellow cursor-pointer"
                      >
                        Date &amp; Time <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Service</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSortBy((s) => (s === 'amount_desc' ? 'amount_asc' : 'amount_desc'))}
                        className="inline-flex items-center gap-1 hover:text-brand-yellow cursor-pointer"
                      >
                        Amount <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3.5 px-4">Payment</th>
                    <th className="py-3.5 px-5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-600/20 text-ds-14">
                  {pagedBookings.map((b) => (
                    <tr
                      key={b.id}
                      onClick={() => navigate(`/jobs/${b.id}`)}
                      className="hover:bg-gray-50 dark:hover:bg-brand-ink/50 cursor-pointer transition-colors"
                    >
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="font-semibold text-brand-ink dark:text-brand-white">{b.scheduledDate}</div>
                        <div className="text-[11px] text-gray-400">{b.scheduledTime}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-brand-ink dark:text-brand-white">{b.customerName}</div>
                        <div className="text-[11px] text-gray-400 truncate max-w-[180px]">{b.address}</div>
                      </td>
                      <td className="py-4 px-4 font-display font-bold text-brand-ink dark:text-brand-white">
                        {b.serviceName}
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="py-4 px-4 text-right font-display font-extrabold text-brand-ink dark:text-brand-yellow whitespace-nowrap">
                        {formatCurrency(b.amount)}
                      </td>
                      <td className="py-4 px-4">
                        <Badge tone={b.paymentStatus === 'PAID' ? 'success' : 'warning'} dot>
                          {b.paymentMethod} • {b.paymentStatus || 'PENDING'}
                        </Badge>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <Button
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/jobs/${b.id}`);
                          }}
                          className="min-h-[36px] py-1 px-3 text-ds-12"
                        >
                          Open
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Bar */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-ds-12 text-gray-400 font-semibold">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, displayedBookings.length)} of {displayedBookings.length} jobs
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                  className="min-h-[40px] py-1.5 px-3 text-ds-12"
                >
                  Prev
                </Button>
                <span className="text-ds-12 font-bold px-2">
                  Page {page + 1} / {totalPages}
                </span>
                <Button
                  variant="secondary"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                  className="min-h-[40px] py-1.5 px-3 text-ds-12"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
