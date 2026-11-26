import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, Search, Download, ArrowUpDown, MapPin } from 'lucide-react';
import { adminService } from '../../services/adminService';
import PaginationBar from '../../components/common/PaginationBar';
import {
  Badge,
  BottomSheet,
  Button,
  Chip,
  EmptyState,
  Input,
  PageHeader,
  SkeletonTableRow,
  StatusBadge,
  showToast,
} from '../../components/ui';

const STATUS_OPTIONS = [
  'ALL',
  'REQUESTED',
  'ACCEPTED',
  'ON_THE_WAY',
  'ARRIVED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'REJECTED',
  'EXPIRED',
];

const exportBookingsCsv = (rows) => {
  if (!rows.length) return;
  const headers = ['ID', 'Service', 'Customer', 'Provider', 'Date', 'Time', 'Amount', 'PaymentMethod', 'PaymentStatus', 'Status'];
  const lines = [
    headers.join(','),
    ...rows.map((b) =>
      [b.id, b.serviceName, b.customerName, b.providerName, b.scheduledDate, b.scheduledTime, b.amount, b.paymentMethod, b.paymentStatus, b.status]
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(',')
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'localgo-bookings.csv';
  a.click();
  URL.revokeObjectURL(url);
};

export const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cursorStack, setCursorStack] = useState([null]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentCursor = cursorStack[cursorStack.length - 1];

  const loadBookings = useCallback(() => {
    setLoading(true);
    adminService.getAllBookings(statusFilter, 15, currentCursor)
      .then((data) => {
        setBookings(data?.content || []);
        setNextCursor(data?.nextCursor || null);
        setHasMore(Boolean(data?.hasMore));
      })
      .catch((err) => showToast.error(err.response?.data?.message || 'Failed to load bookings.'))
      .finally(() => setLoading(false));
  }, [statusFilter, currentCursor]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleStatusChange = (nextStatus) => {
    setStatusFilter(nextStatus);
    setCursorStack([null]);
  };

  const displayedBookings = useMemo(() => {
    let list = [...bookings];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.serviceName?.toLowerCase().includes(q) ||
          b.customerName?.toLowerCase().includes(q) ||
          b.providerName?.toLowerCase().includes(q) ||
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
  }, [bookings, search, sortBy]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Marketplace Activity"
        title="All Bookings"
        subtitle="Audit booking lifecycles, doorstep schedules, and settlement status"
        actions={
          <Button
            variant="secondary"
            disabled={displayedBookings.length === 0}
            onClick={() => exportBookingsCsv(displayedBookings)}
            leftIcon={<Download className="w-4 h-4" />}
            className="min-h-[42px] py-1.5 px-3.5 text-ds-12"
          >
            Export CSV
          </Button>
        }
      />

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_OPTIONS.map((s) => (
            <Chip
              key={s}
              selected={statusFilter === s}
              tone="yellow"
              onClick={() => handleStatusChange(s)}
            >
              {s.replace(/_/g, ' ')}
            </Chip>
          ))}
        </div>

        <div className="w-full sm:w-80">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter current page by service, customer, pro, ID..."
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-brand-white rounded-card border border-gray-200 p-4 shadow-card">
          {[1, 2, 3, 4, 5].map((i) => <SkeletonTableRow key={i} />)}
        </div>
      ) : displayedBookings.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-7 h-7" />}
          title="No bookings match this filter"
          description="Switch status chips or clear the search filter."
        />
      ) : (
        <div className="bg-brand-white rounded-card border border-gray-200 shadow-card overflow-x-auto">
          <table className="w-full text-left border-collapse text-ds-12">
            <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-600">
              <tr>
                <th className="py-3.5 px-5">Service</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Provider</th>
                <th className="py-3.5 px-4">
                  <button
                    type="button"
                    onClick={() => setSortBy((s) => (s === 'date_desc' ? 'date_asc' : 'date_desc'))}
                    className="inline-flex items-center gap-1 hover:text-brand-ink cursor-pointer"
                  >
                    Schedule <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3.5 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => setSortBy((s) => (s === 'amount_desc' ? 'amount_asc' : 'amount_desc'))}
                    className="inline-flex items-center gap-1 hover:text-brand-ink cursor-pointer"
                  >
                    Amount <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayedBookings.map((b) => (
                <tr
                  key={b.id}
                  onClick={() => setSelectedBooking(b)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="py-4 px-5">
                    <div className="font-display font-bold text-ds-14 text-brand-ink">{b.serviceName}</div>
                    <div className="text-[11px] text-gray-400 font-mono">#{String(b.id).slice(0, 10)}</div>
                  </td>
                  <td className="py-4 px-4 font-semibold text-brand-ink">{b.customerName}</td>
                  <td className="py-4 px-4 font-semibold text-brand-ink">{b.providerName}</td>
                  <td className="py-4 px-4 text-gray-600 whitespace-nowrap">
                    {b.scheduledDate} {b.scheduledTime}
                  </td>
                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    <div className="font-display font-bold text-ds-14 text-brand-ink">₹{b.amount}</div>
                    <div className="text-[11px] text-gray-600">{b.paymentMethod} • {b.paymentStatus}</div>
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="py-4 px-5 text-right">
                    <Button
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBooking(b);
                      }}
                      className="min-h-[36px] py-1 px-3 text-ds-12"
                    >
                      Inspect
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PaginationBar
        pageIndex={cursorStack.length - 1}
        hasPrev={cursorStack.length > 1}
        hasNext={hasMore && Boolean(nextCursor)}
        itemCount={bookings.length}
        loading={loading}
        onPrev={() => setCursorStack((prev) => prev.slice(0, -1))}
        onNext={() => nextCursor && setCursorStack((prev) => [...prev, nextCursor])}
      />

      <BottomSheet
        open={Boolean(selectedBooking)}
        onClose={() => setSelectedBooking(null)}
        title={selectedBooking?.serviceName || 'Booking Details'}
        subtitle={selectedBooking ? `Booking #${selectedBooking.id}` : ''}
        desktopPresentation="drawer"
      >
        {selectedBooking && (
          <div className="space-y-4 text-ds-12">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <StatusBadge status={selectedBooking.status} />
              <Badge tone={selectedBooking.paymentStatus === 'PAID' ? 'success' : 'warning'} dot>
                {selectedBooking.paymentMethod} • {selectedBooking.paymentStatus}
              </Badge>
            </div>

            <div className="bg-gray-50 p-4 rounded-card border border-gray-200 space-y-2.5">
              <div className="flex justify-between">
                <span className="text-gray-600">Customer</span>
                <span className="font-bold text-brand-ink">{selectedBooking.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Provider</span>
                <span className="font-bold text-brand-ink">{selectedBooking.providerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Schedule</span>
                <span className="font-bold text-brand-ink">{selectedBooking.scheduledDate} at {selectedBooking.scheduledTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount</span>
                <span className="font-display font-extrabold text-ds-16 text-brand-ink">₹{selectedBooking.amount}</span>
              </div>
            </div>

            {selectedBooking.address && (
              <div className="space-y-1">
                <span className="font-bold text-gray-400 uppercase text-[11px] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Address
                </span>
                <p className="font-semibold text-brand-ink bg-gray-50 p-3 rounded-card border border-gray-200">
                  {selectedBooking.address}
                </p>
              </div>
            )}

            {selectedBooking.description && (
              <div className="space-y-1">
                <span className="font-bold text-gray-400 uppercase text-[11px] block">Issue Description</span>
                <p className="text-brand-ink bg-gray-50 p-3 rounded-card border border-gray-200">
                  &ldquo;{selectedBooking.description}&rdquo;
                </p>
              </div>
            )}

            {selectedBooking.cancellationReason && (
              <div className="p-3 rounded-card bg-rose-50 border border-rose-200 text-rose-900">
                <span className="font-bold block text-[11px] uppercase mb-0.5">Cancellation / Expiry Note</span>
                {selectedBooking.cancellationReason}
              </div>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
