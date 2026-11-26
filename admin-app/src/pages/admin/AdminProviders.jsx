import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Check,
  X,
  MapPin,
  Phone,
  Mail,
  Star,
  Briefcase,
  ExternalLink,
  RotateCcw,
  Download,
  FileCheck,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import PaginationBar from '../../components/common/PaginationBar';
import {
  Avatar,
  Badge,
  BottomSheet,
  Button,
  Chip,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  PageHeader,
  SkeletonTableRow,
  Tabs,
  showToast,
} from '../../components/ui';

const REJECTION_PRESETS = [
  'Incomplete or unclear business description',
  'Unreachable or invalid contact phone number',
  'Service location/coordinates could not be verified',
  'Duplicate provider account',
];

const downloadCsv = (rows, filename) => {
  if (!rows.length) return;
  const headers = ['ID', 'Name', 'Email', 'Phone', 'Status', 'Available', 'Rating', 'CompletedJobs', 'StartingPrice', 'RadiusKm'];
  const csvLines = [
    headers.join(','),
    ...rows.map((p) =>
      [
        p.id,
        p.name,
        p.email,
        p.phone || '',
        p.verificationStatus,
        p.available ? 'ONLINE' : 'OFFLINE',
        p.rating ?? 0,
        p.completedJobs ?? 0,
        p.startingPrice ?? 0,
        p.serviceRadiusKm ?? 15,
      ]
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(',')
    ),
  ];
  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const AdminProviders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status')?.toUpperCase() || 'ALL';
  const initialQ = searchParams.get('q') || '';

  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [search, setSearch] = useState(initialQ);
  const [providers, setProviders] = useState([]);
  const [counts, setCounts] = useState({ ALL: 0, PENDING: 0, VERIFIED: 0, REJECTED: 0 });
  const [cursorStack, setCursorStack] = useState([null]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [selectedProvider, setSelectedProvider] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingId, setSubmittingId] = useState(null);

  const currentCursor = cursorStack[cursorStack.length - 1];

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) setSearch(q);
  }, [searchParams]);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await adminService.getAllProviders(statusFilter, search, 15, currentCursor);
      setProviders(data?.content || []);
      setNextCursor(data?.nextCursor || null);
      setHasMore(Boolean(data?.hasMore));
      setTotalElements(typeof data?.totalElements === 'number' ? data.totalElements : (data?.content || []).length);
      if (data?.counts) setCounts(data.counts);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load providers.';
      setLoadError(msg);
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, currentCursor]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleTabChange = (nextStatus) => {
    setStatusFilter(nextStatus);
    setCursorStack([null]);
    if (nextStatus === 'ALL') {
      setSearchParams(search ? { q: search } : {});
    } else {
      setSearchParams(search ? { status: nextStatus, q: search } : { status: nextStatus });
    }
  };

  const handleVerifyAction = async (providerId, targetStatus, reason = '') => {
    setSubmittingId(providerId);
    try {
      const updated = await adminService.verifyProvider(providerId, targetStatus, reason);
      showToast.success(`Provider marked as ${targetStatus}`);
      setRejectTarget(null);
      setRejectionReason('');
      if (selectedProvider?.id === providerId) {
        setSelectedProvider(updated);
      }
      window.dispatchEvent(new Event('localgo:admin-refresh'));
      await fetchProviders();
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Verification update failed.');
    } finally {
      setSubmittingId(null);
    }
  };

  const statusTabs = [
    { key: 'PENDING', label: 'Pending Review', count: counts?.PENDING ?? 0 },
    { key: 'VERIFIED', label: 'Verified', count: counts?.VERIFIED ?? 0 },
    { key: 'REJECTED', label: 'Rejected', count: counts?.REJECTED ?? 0 },
    { key: 'ALL', label: 'All Providers', count: counts?.ALL ?? 0 },
  ];

  const renderVerificationBadge = (status) => {
    if (status === 'VERIFIED') return <Badge tone="success" dot>Verified</Badge>;
    if (status === 'REJECTED') return <Badge tone="danger" dot>Rejected</Badge>;
    return <Badge tone="warning" dot>Pending Review</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Trust & Safety"
        title="Provider Verification Console"
        subtitle="Inspect profiles, coverage locations, and KYC placeholders before approving"
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="secondary"
              onClick={() => downloadCsv(providers, `localgo-providers-${statusFilter.toLowerCase()}.csv`)}
              disabled={providers.length === 0}
              leftIcon={<Download className="w-4 h-4" />}
              className="min-h-[42px] py-1.5 px-3.5 text-ds-12"
            >
              Export CSV
            </Button>
            <Button
              variant="secondary"
              onClick={fetchProviders}
              leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
              className="min-h-[42px] py-1.5 px-3.5 text-ds-12"
            >
              Refresh
            </Button>
          </div>
        }
      />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <Tabs tabs={statusTabs} activeTab={statusFilter} onChange={handleTabChange} />

        <div className="w-full lg:w-80">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCursorStack([null]);
            }}
            placeholder="Search name, email, phone, service..."
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-brand-white rounded-card border border-gray-200 p-4 shadow-card">
          {[1, 2, 3, 4, 5].map((i) => <SkeletonTableRow key={i} />)}
        </div>
      ) : loadError ? (
        <ErrorState message={loadError} onRetry={fetchProviders} />
      ) : providers.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="w-7 h-7" />}
          title="No providers match this filter"
          description="Try switching verification status tabs or clearing your search query."
          actionLabel="Show All Providers"
          actionVariant="accent"
          onAction={() => {
            setSearch('');
            handleTabChange('ALL');
          }}
        />
      ) : (
        <div className="bg-brand-white rounded-card border border-gray-200 shadow-card overflow-x-auto">
          <table className="w-full text-left border-collapse text-ds-12">
            <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-600">
              <tr>
                <th className="py-3.5 px-5">Provider</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Services &amp; Radius</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Performance</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {providers.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-5 align-top">
                    <button
                      type="button"
                      onClick={() => setSelectedProvider(p)}
                      className="flex items-center gap-3 text-left group cursor-pointer"
                    >
                      <Avatar name={p.name} size="sm" status={p.available ? 'online' : 'offline'} />
                      <div>
                        <div className="font-display font-bold text-ds-14 text-brand-ink group-hover:underline">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-gray-600 mt-0.5">
                          {p.experienceYears ?? 0} yrs exp &bull; {p.available ? 'On Duty' : 'Offline'}
                        </div>
                      </div>
                    </button>
                  </td>
                  <td className="py-4 px-4 align-top">
                    <div className="font-semibold text-brand-ink">{p.email}</div>
                    <div className="text-gray-600 mt-0.5">{p.phone || 'No phone provided'}</div>
                  </td>
                  <td className="py-4 px-4 align-top">
                    <div className="flex flex-wrap gap-1 mb-1">
                      {(p.services || []).map((s) => (
                        <span key={s.id} className="px-2 py-0.5 bg-gray-100 text-brand-ink rounded-card text-[11px] font-semibold">
                          {s.name}
                        </span>
                      ))}
                    </div>
                    <div className="text-[11px] text-gray-600">
                      Starts ₹{p.startingPrice ?? 0} &bull; {p.serviceRadiusKm ?? 10} km radius
                    </div>
                  </td>
                  <td className="py-4 px-4 align-top space-y-1">
                    {renderVerificationBadge(p.verificationStatus)}
                    {p.verificationNotes && (
                      <div className="text-[11px] text-gray-600 max-w-[180px] truncate" title={p.verificationNotes}>
                        {p.verificationNotes}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4 align-top">
                    <div className="font-bold text-brand-ink flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-brand-yellow fill-brand-yellow" />
                      {p.rating > 0 ? p.rating.toFixed(1) : 'New'}
                    </div>
                    <div className="text-[11px] text-gray-600 mt-0.5">{p.completedJobs ?? 0} jobs</div>
                  </td>
                  <td className="py-4 px-5 align-top">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <Button
                        variant="secondary"
                        onClick={() => setSelectedProvider(p)}
                        className="min-h-[36px] py-1 px-3 text-ds-12"
                      >
                        Inspect
                      </Button>
                      {p.verificationStatus !== 'VERIFIED' && (
                        <Button
                          variant="accent"
                          disabled={submittingId === p.id}
                          onClick={() => handleVerifyAction(p.id, 'VERIFIED', 'Verified by LocalGo Admin')}
                          leftIcon={<Check className="w-3.5 h-3.5" />}
                          className="min-h-[36px] py-1 px-3 text-ds-12"
                        >
                          Approve
                        </Button>
                      )}
                      {p.verificationStatus !== 'REJECTED' && (
                        <Button
                          variant="danger"
                          disabled={submittingId === p.id}
                          onClick={() => {
                            setRejectTarget(p);
                            setRejectionReason(p.verificationNotes || '');
                          }}
                          leftIcon={<X className="w-3.5 h-3.5" />}
                          className="min-h-[36px] py-1 px-3 text-ds-12"
                        >
                          Reject
                        </Button>
                      )}
                    </div>
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
        itemCount={providers.length}
        totalElements={totalElements}
        loading={loading}
        onPrev={() => setCursorStack((prev) => prev.slice(0, -1))}
        onNext={() => nextCursor && setCursorStack((prev) => [...prev, nextCursor])}
      />

      {/* Right-Side Detail Drawer */}
      <BottomSheet
        open={Boolean(selectedProvider)}
        onClose={() => setSelectedProvider(null)}
        title={selectedProvider?.name || 'Provider Audit'}
        subtitle={selectedProvider ? `ID: ${selectedProvider.id}` : ''}
        desktopPresentation="drawer"
        footer={
          selectedProvider && (
            <div className="flex flex-wrap items-center justify-end gap-2.5">
              {selectedProvider.verificationStatus !== 'PENDING' && (
                <Button
                  variant="secondary"
                  disabled={submittingId === selectedProvider.id}
                  onClick={() => handleVerifyAction(selectedProvider.id, 'PENDING', 'Moved back to pending review')}
                  leftIcon={<RotateCcw className="w-4 h-4" />}
                >
                  Re-open
                </Button>
              )}
              {selectedProvider.verificationStatus !== 'REJECTED' && (
                <Button
                  variant="danger"
                  disabled={submittingId === selectedProvider.id}
                  onClick={() => {
                    setRejectTarget(selectedProvider);
                    setRejectionReason(selectedProvider.verificationNotes || '');
                  }}
                  leftIcon={<X className="w-4 h-4" />}
                >
                  Reject
                </Button>
              )}
              {selectedProvider.verificationStatus !== 'VERIFIED' && (
                <Button
                  variant="accent"
                  disabled={submittingId === selectedProvider.id}
                  onClick={() => handleVerifyAction(selectedProvider.id, 'VERIFIED', 'Approved by LocalGo Admin')}
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  Approve &amp; Verify
                </Button>
              )}
            </div>
          )
        }
      >
        {selectedProvider && (
          <div className="space-y-5 text-ds-12">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-100">
              {renderVerificationBadge(selectedProvider.verificationStatus)}
              <span className="text-gray-600">
                {selectedProvider.reviewedAt
                  ? `Reviewed ${new Date(selectedProvider.reviewedAt).toLocaleString()}`
                  : 'Not reviewed yet'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 bg-gray-50 p-4 rounded-card border border-gray-200">
              <div className="flex items-center gap-2 text-brand-ink">
                <Mail className="w-4 h-4 text-gray-600 shrink-0" />
                <a href={`mailto:${selectedProvider.email}`} className="hover:underline font-semibold truncate">
                  {selectedProvider.email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-brand-ink">
                <Phone className="w-4 h-4 text-gray-600 shrink-0" />
                <span>{selectedProvider.phone || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-2 text-brand-ink">
                <Briefcase className="w-4 h-4 text-gray-600 shrink-0" />
                <span>{selectedProvider.experienceYears ?? 0} years experience</span>
              </div>
              <div className="flex items-center gap-2 text-brand-ink">
                <MapPin className="w-4 h-4 text-gray-600 shrink-0" />
                <span>
                  {selectedProvider.serviceRadiusKm ?? 10} km radius
                  {selectedProvider.latitude != null && selectedProvider.longitude != null && (
                    <> ({selectedProvider.latitude.toFixed(4)}, {selectedProvider.longitude.toFixed(4)})</>
                  )}
                </span>
              </div>
            </div>

            {selectedProvider.latitude != null && selectedProvider.longitude != null && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${selectedProvider.latitude},${selectedProvider.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-bold text-brand-ink hover:underline"
              >
                <ExternalLink className="w-4 h-4" /> Verify Base Location on Google Maps
              </a>
            )}

            <div className="space-y-1.5">
              <h4 className="font-bold text-gray-600 uppercase text-[11px] tracking-wider">Business Description</h4>
              <p className="text-brand-ink leading-relaxed bg-gray-50 p-3.5 rounded-card border border-gray-200">
                {selectedProvider.description || 'No description submitted.'}
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-gray-600 uppercase text-[11px] tracking-wider">Services &amp; Coverage</h4>
              <div className="flex flex-wrap gap-1.5">
                {(selectedProvider.services || []).map((s) => (
                  <Badge key={s.id} tone="ink">{s.name}</Badge>
                ))}
              </div>
            </div>

            {/* KYC Placeholder Section */}
            <div className="space-y-2 p-4 rounded-card bg-brand-yellowSoft/60 border border-brand-yellow">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-display font-bold text-ds-12 text-brand-ink inline-flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4" /> KYC &amp; Document Checklist
                </h4>
                <Badge tone="warning">Placeholder</Badge>
              </div>
              <p className="text-[11px] text-gray-900">
                Document storage endpoints (Aadhaar / Trade License) are not yet implemented in the backend. Verify profile contact &amp; coordinates manually.
              </p>
            </div>

            {selectedProvider.verificationNotes && (
              <div className="p-3.5 rounded-card bg-gray-50 border border-gray-200 text-brand-ink">
                <span className="font-bold block text-[11px] uppercase tracking-wider text-gray-600 mb-0.5">
                  Last Review Notes
                </span>
                {selectedProvider.verificationNotes}
              </div>
            )}
          </div>
        )}
      </BottomSheet>

      {/* Reject Modal with Required Reason & Preset Chips */}
      <Modal
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        title="Reject Provider Verification"
        subtitle={rejectTarget ? `Explain why ${rejectTarget.name} is being rejected.` : ''}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {REJECTION_PRESETS.map((preset) => (
              <Chip
                key={preset}
                selected={rejectionReason === preset}
                tone="ink"
                onClick={() => setRejectionReason(preset)}
              >
                {preset}
              </Chip>
            ))}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reject-reason" className="block text-ds-12 font-bold text-gray-900">
              Rejection Reason <span className="text-status-danger">*</span>
            </label>
            <textarea
              id="reject-reason"
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter clear verification feedback for the provider..."
              className="w-full p-3 rounded-input border border-gray-200 focus:border-brand-ink outline-none text-ds-14 text-brand-ink"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button variant="secondary" fullWidth onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              fullWidth
              disabled={!rejectionReason.trim() || submittingId === rejectTarget?.id}
              loading={submittingId === rejectTarget?.id}
              onClick={() => handleVerifyAction(rejectTarget.id, 'REJECTED', rejectionReason.trim())}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
