import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Star, EyeOff, Eye, Search, Download, ArrowUpDown, AlertTriangle } from 'lucide-react';
import { adminService } from '../../services/adminService';
import PaginationBar from '../../components/common/PaginationBar';
import {
  Badge,
  BottomSheet,
  Button,
  Chip,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  RatingStars,
  SkeletonTableRow,
  showToast,
} from '../../components/ui';

const FILTER_MODES = [
  { key: 'ALL', label: 'All Reviews' },
  { key: 'LOW', label: '1–2★ Flagged' },
  { key: 'VISIBLE', label: 'Visible' },
  { key: 'HIDDEN', label: 'Hidden' },
];

const exportReviewsCsv = (rows) => {
  if (!rows.length) return;
  const headers = ['ID', 'CustomerName', 'ProviderID', 'BookingID', 'Rating', 'Hidden', 'Comment'];
  const lines = [
    headers.join(','),
    ...rows.map((r) =>
      [r.id, r.customerName || 'Customer', r.providerId, r.bookingId, r.rating, Boolean(r.hidden), r.comment || '']
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(',')
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'localgo-reviews.csv';
  a.click();
  URL.revokeObjectURL(url);
};

export const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [filterMode, setFilterMode] = useState('ALL');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('rating_asc');
  const [selectedReview, setSelectedReview] = useState(null);
  const [cursorStack, setCursorStack] = useState([null]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const currentCursor = cursorStack[cursorStack.length - 1];

  const loadReviews = useCallback(() => {
    setLoading(true);
    setLoadError('');
    adminService.getAllReviews(12, currentCursor)
      .then((data) => {
        setReviews(data?.content || []);
        setNextCursor(data?.nextCursor || null);
        setHasMore(Boolean(data?.hasMore));
      })
      .catch((err) => {
        const msg = err.response?.data?.message || 'Failed to load reviews.';
        setLoadError(msg);
        showToast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [currentCursor]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleToggleHide = async (id, skipUndoToast = false) => {
    try {
      const hidden = await adminService.toggleHideReview(id);
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, hidden } : r)));
      if (selectedReview?.id === id) {
        setSelectedReview((prev) => (prev ? { ...prev, hidden } : prev));
      }

      if (skipUndoToast) {
        showToast.success(hidden ? 'Review hidden' : 'Review restored');
        return;
      }

      toast(
        (t) => (
          <div className="flex items-center gap-3">
            <span>{hidden ? 'Review hidden from public view' : 'Review restored publicly'}</span>
            <button
              type="button"
              onClick={() => {
                toast.dismiss(t.id);
                handleToggleHide(id, true);
              }}
              className="px-2.5 py-1 rounded-card bg-brand-yellow text-brand-ink font-extrabold text-[11px] hover:bg-brand-yellowHover cursor-pointer"
            >
              Undo
            </button>
          </div>
        ),
        { duration: 5000 }
      );
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Could not update review.');
    }
  };

  const displayedReviews = useMemo(() => {
    let list = [...reviews];
    if (filterMode === 'LOW') list = list.filter((r) => Number(r.rating) <= 2);
    if (filterMode === 'VISIBLE') list = list.filter((r) => !r.hidden);
    if (filterMode === 'HIDDEN') list = list.filter((r) => Boolean(r.hidden));

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.customerName?.toLowerCase().includes(q) ||
          r.comment?.toLowerCase().includes(q) ||
          r.providerId?.toLowerCase().includes(q) ||
          r.bookingId?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'rating_asc') return (Number(a.rating) || 0) - (Number(b.rating) || 0);
      if (sortBy === 'rating_desc') return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      return 0;
    });

    return list;
  }, [reviews, filterMode, search, sortBy]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Quality Control"
        title="Review Moderation"
        subtitle="Inspect ratings, audit flagged 1–2 star feedback, and hide or restore inappropriate reviews"
        actions={
          <Button
            variant="secondary"
            disabled={displayedReviews.length === 0}
            onClick={() => exportReviewsCsv(displayedReviews)}
            leftIcon={<Download className="w-4 h-4" />}
            className="min-h-[42px] py-1.5 px-3.5 text-ds-12"
          >
            Export CSV
          </Button>
        }
      />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {FILTER_MODES.map((m) => (
            <Chip
              key={m.key}
              selected={filterMode === m.key}
              tone="yellow"
              onClick={() => setFilterMode(m.key)}
            >
              {m.label}
            </Chip>
          ))}
        </div>

        <div className="w-full lg:w-72">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search comment, customer, provider..."
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-brand-white rounded-card border border-gray-200 p-4 shadow-card">
          {[1, 2, 3, 4].map((i) => <SkeletonTableRow key={i} />)}
        </div>
      ) : loadError ? (
        <ErrorState message={loadError} onRetry={loadReviews} />
      ) : displayedReviews.length === 0 ? (
        <EmptyState
          icon={<Star className="w-7 h-7" />}
          title="No reviews match this filter"
          description="Try clearing search or switching back to All Reviews."
        />
      ) : (
        <div className="bg-brand-white rounded-card border border-gray-200 shadow-card overflow-x-auto">
          <table className="w-full text-left border-collapse text-ds-12">
            <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-600">
              <tr>
                <th className="py-3.5 px-5">
                  <button
                    type="button"
                    onClick={() => setSortBy((s) => (s === 'rating_asc' ? 'rating_desc' : 'rating_asc'))}
                    className="inline-flex items-center gap-1 hover:text-brand-ink cursor-pointer"
                  >
                    Rating <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3.5 px-4">Customer &amp; Feedback</th>
                <th className="py-3.5 px-4">Provider / Booking</th>
                <th className="py-3.5 px-4">Visibility</th>
                <th className="py-3.5 px-5 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayedReviews.map((r) => {
                const isLow = Number(r.rating) <= 2;
                return (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedReview(r)}
                    className={`cursor-pointer transition-colors ${
                      isLow
                        ? 'bg-amber-50/75 hover:bg-amber-100/70 border-l-4 border-l-status-danger'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="py-4 px-5 align-top whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Badge tone={isLow ? 'danger' : 'accent'} icon={<Star className="w-3 h-3 fill-current" />}>
                          {r.rating} ★
                        </Badge>
                        {isLow && (
                          <span className="text-[10px] font-extrabold uppercase text-status-danger inline-flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3" /> Low
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 align-top max-w-md">
                      <div className="font-display font-bold text-brand-ink">{r.customerName || 'Customer'}</div>
                      <p className="text-gray-600 line-clamp-2 mt-0.5">{r.comment || 'No written comment.'}</p>
                    </td>
                    <td className="py-4 px-4 align-top font-mono text-[11px] text-gray-600">
                      <div>Prov: {r.providerId}</div>
                      <div>Book: #{String(r.bookingId || '').slice(0, 10)}</div>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <Badge tone={r.hidden ? 'danger' : 'success'} dot>
                        {r.hidden ? 'Hidden' : 'Visible'}
                      </Badge>
                    </td>
                    <td className="py-4 px-5 align-top text-right">
                      <Button
                        variant={r.hidden ? 'secondary' : 'danger'}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleHide(r.id);
                        }}
                        leftIcon={r.hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        className="min-h-[36px] py-1 px-3 text-ds-12"
                      >
                        {r.hidden ? 'Restore' : 'Hide'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <PaginationBar
        pageIndex={cursorStack.length - 1}
        hasPrev={cursorStack.length > 1}
        hasNext={hasMore && Boolean(nextCursor)}
        itemCount={reviews.length}
        loading={loading}
        onPrev={() => setCursorStack((prev) => prev.slice(0, -1))}
        onNext={() => nextCursor && setCursorStack((prev) => [...prev, nextCursor])}
      />

      <BottomSheet
        open={Boolean(selectedReview)}
        onClose={() => setSelectedReview(null)}
        title="Review Audit"
        subtitle={selectedReview ? `Review #${selectedReview.id}` : ''}
        desktopPresentation="drawer"
        footer={
          selectedReview && (
            <Button
              variant={selectedReview.hidden ? 'accent' : 'danger'}
              fullWidth
              onClick={() => handleToggleHide(selectedReview.id)}
              leftIcon={selectedReview.hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            >
              {selectedReview.hidden ? 'Restore Review Publicly' : 'Hide Review from Public View'}
            </Button>
          )
        }
      >
        {selectedReview && (
          <div className="space-y-4 text-ds-14">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <RatingStars rating={selectedReview.rating} size="md" />
              <Badge tone={selectedReview.hidden ? 'danger' : 'success'} dot>
                {selectedReview.hidden ? 'Hidden' : 'Visible'}
              </Badge>
            </div>

            <div className="bg-gray-50 p-4 rounded-card border border-gray-200 space-y-2 text-ds-12">
              <div className="flex justify-between">
                <span className="text-gray-600">Customer</span>
                <span className="font-bold text-brand-ink">{selectedReview.customerName || 'Customer'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Provider ID</span>
                <span className="font-mono text-brand-ink">{selectedReview.providerId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Booking ID</span>
                <span className="font-mono text-brand-ink">{selectedReview.bookingId}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block">Full Comment</span>
              <p className="p-4 rounded-card bg-gray-50 border border-gray-200 text-brand-ink leading-relaxed">
                &ldquo;{selectedReview.comment || 'No written feedback submitted.'}&rdquo;
              </p>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
