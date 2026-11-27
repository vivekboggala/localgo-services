import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Check,
  Navigation,
  Wrench,
  CheckCircle2,
  ShieldCheck,
  FileText,
  XCircle,
  ExternalLink,
  Wallet,
} from 'lucide-react';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { providerPortalService } from '../../services/providerPortalService';
import {
  Avatar,
  Badge,
  Button,
  Chip,
  ConfirmDialog,
  ErrorState,
  Input,
  OtpInput,
  PageHeader,
  SkeletonList,
  StatusBadge,
  StatusTimeline,
  showToast,
} from '../../components/ui';
import { formatCurrency } from '../../utils/helpers';

const CANCEL_REASONS = [
  'Unable to reach address',
  'Customer unreachable',
  'Emergency / vehicle issue',
  'Parts unavailable today',
];

export const ProviderJobDetailPanel = ({ jobId, embedded = false, onStatusChanged = null }) => {
  const navigate = useNavigate();
  const { user, firebaseUser } = useAuth();
  const uid = firebaseUser?.uid || user?.id;

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');

  const [workSummary, setWorkSummary] = useState('');
  const [extraCharges, setExtraCharges] = useState('');

  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const loadJob = () => {
    if (!jobId || !uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    providerPortalService.getBookingById(jobId)
      .then((data) => setJob(data))
      .catch((err) => {
        console.error('Failed to load job details:', err);
        setError(err.response?.data?.message || 'Unable to load booking details.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setOtpCode('');
    setOtpError('');
    setWorkSummary('');
    setExtraCharges('');
    setConfirmCancelOpen(false);
    setCancelReason('');
    loadJob();
    if (!jobId || !uid) return undefined;

    const docRef = doc(db, 'bookings', jobId);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const live = docSnap.data();
          setJob((prev) => {
            const amountInRupees = live.amount != null ? Number(live.amount) / 100 : (prev?.amount ?? 0);
            const extraInRupees =
              live.extraAmountPaise != null
                ? Number(live.extraAmountPaise) / 100
                : (prev?.extraAmount ?? 0);
            return {
              ...(prev || {}),
              ...live,
              id: docSnap.id,
              amount: amountInRupees,
              extraAmount: extraInRupees,
              totalAmount: amountInRupees + extraInRupees,
              startOtp: undefined,
              completionOtp: undefined,
            };
          });
        }
      },
      (err) => console.warn('Real-time listener warning for provider job:', err)
    );

    return () => unsubscribe();
  }, [jobId, uid]);

  const getGoogleMapsUrl = () => {
    if (job?.latitude && job?.longitude) {
      return `https://www.google.com/maps/dir/?api=1&destination=${job.latitude},${job.longitude}`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job?.address || '')}`;
  };

  const handleTransition = async (targetStatus, reason = null, otp = null, openMaps = false) => {
    if (openMaps) {
      window.open(getGoogleMapsUrl(), '_blank', 'noopener,noreferrer');
    }
    setSubmitting(true);
    setOtpError('');
    try {
      const updated = await providerPortalService.updateBookingStatus(
        jobId,
        targetStatus,
        reason,
        otp,
        targetStatus === 'COMPLETED' ? Number(extraCharges) || 0 : null,
        targetStatus === 'COMPLETED' ? workSummary.trim() : null
      );
      if (updated) {
        setJob(updated);
      } else {
        setJob((prev) => (prev ? { ...prev, status: targetStatus } : prev));
      }
      setOtpCode('');
      setConfirmCancelOpen(false);
      setCancelReason('');
      if (targetStatus === 'COMPLETED' && (workSummary.trim() || Number(extraCharges) > 0)) {
        try {
          localStorage.setItem(
            `localgo_job_notes_${jobId}`,
            JSON.stringify({ workSummary: workSummary.trim(), extraCharges: Number(extraCharges) || 0 })
          );
        } catch {}
      }
      showToast.success(`Updated to ${targetStatus.replace(/_/g, ' ')}`);
      onStatusChanged?.();
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not update booking status.';
      if (targetStatus === 'IN_PROGRESS') setOtpError(msg);
      showToast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = () => {
    if (!/^\d{4}$/.test(otpCode.trim())) {
      setOtpError('Enter the 4-digit OTP shared by the customer.');
      return;
    }
    handleTransition('IN_PROGRESS', null, otpCode.trim());
  };

  const handleConfirmCashReceived = async () => {
    setSubmitting(true);
    try {
      const updated = await providerPortalService.confirmCashReceived(job.id);
      if (updated) {
        setJob(updated);
      } else {
        setJob((prev) => (prev ? { ...prev, paymentStatus: 'PAID' } : prev));
      }
      showToast.success('Cash payment confirmed!');
      onStatusChanged?.();
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to confirm cash receipt.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <SkeletonList count={3} />;
  }

  if (error || !job) {
    return <ErrorState title="Job Unavailable" message={error || 'Job not found.'} onRetry={loadJob} />;
  }

  const isTerminated = ['REJECTED', 'CANCELLED', 'EXPIRED'].includes(job.status);
  const canCancel = ['REQUESTED', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED'].includes(job.status);

  let savedNotes = null;
  try {
    const raw = localStorage.getItem(`localgo_job_notes_${jobId}`);
    if (raw) savedNotes = JSON.parse(raw);
  } catch {}

  const extraAmountNum = Number(job.extraAmount || 0) || Number(extraCharges) || savedNotes?.extraCharges || 0;
  const totalDisplayAmount = Number(job.amount || 0) + extraAmountNum;

  const renderPrimaryCta = () => {
    if (isTerminated) return null;

    if (job.status === 'REQUESTED') {
      return (
        <Button
          variant="accent"
          size="lg"
          fullWidth
          loading={submitting}
          leftIcon={<Check className="w-5 h-5" strokeWidth={2.5} />}
          onClick={() => handleTransition('ACCEPTED')}
        >
          Accept Request &bull; {formatCurrency(job.amount)}
        </Button>
      );
    }
    if (job.status === 'ACCEPTED') {
      return (
        <Button
          variant="accent"
          size="lg"
          fullWidth
          loading={submitting}
          leftIcon={<Navigation className="w-5 h-5" strokeWidth={2.4} />}
          onClick={() => handleTransition('ON_THE_WAY', null, null, true)}
        >
          Start Trip &amp; Open Maps
        </Button>
      );
    }
    if (job.status === 'ON_THE_WAY') {
      return (
        <Button
          variant="accent"
          size="lg"
          fullWidth
          loading={submitting}
          leftIcon={<MapPin className="w-5 h-5" strokeWidth={2.4} />}
          onClick={() => handleTransition('ARRIVED')}
        >
          I&apos;ve Arrived
        </Button>
      );
    }
    if (job.status === 'ARRIVED') {
      return (
        <Button
          variant="accent"
          size="lg"
          fullWidth
          loading={submitting}
          disabled={otpCode.length !== 4}
          leftIcon={<ShieldCheck className="w-5 h-5" strokeWidth={2.4} />}
          onClick={handleVerifyOtp}
        >
          Verify OTP &amp; Start Job
        </Button>
      );
    }
    if (job.status === 'IN_PROGRESS') {
      return (
        <Button
          variant="accent"
          size="lg"
          fullWidth
          loading={submitting}
          leftIcon={<CheckCircle2 className="w-5 h-5" strokeWidth={2.4} />}
          onClick={() => handleTransition('COMPLETED')}
        >
          Complete Job
        </Button>
      );
    }
    if (job.status === 'COMPLETED' && job.paymentStatus !== 'PAID') {
      const label =
        job.paymentMethod === 'UPI' && job.paymentUtr
          ? `Verify UTR (${job.paymentUtr}) & Confirm Paid`
          : job.paymentMethod === 'UPI'
          ? 'Confirm UPI Payment Received'
          : 'Collect Cash & Confirm Paid';
      return (
        <Button
          variant="accent"
          size="lg"
          fullWidth
          loading={submitting}
          leftIcon={<Wallet className="w-5 h-5" strokeWidth={2.4} />}
          onClick={handleConfirmCashReceived}
        >
          {label} &bull; {formatCurrency(totalDisplayAmount)}
        </Button>
      );
    }
    if (job.status === 'COMPLETED') {
      return (
        <Button variant="accent" size="lg" fullWidth onClick={() => navigate('/earnings')}>
          View Earnings
        </Button>
      );
    }
    return null;
  };

  const primaryCta = renderPrimaryCta();

  return (
    <div className="space-y-6 pb-24 lg:pb-0">
      {embedded ? (
        <div className="bg-brand-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600/30 rounded-sheet p-5 shadow-card flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-gray-400">#{job.id}</span>
            <div className="flex items-center gap-3">
              <h2 className="font-display font-bold text-ds-20 text-brand-ink dark:text-brand-white">
                {job.serviceName || 'Job Execution'}
              </h2>
              <StatusBadge status={job.status} />
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={() => navigate(`/jobs/${job.id}`)}
            rightIcon={<ExternalLink className="w-4 h-4" />}
            className="min-h-[40px] py-1.5 px-3 text-ds-12"
          >
            Full View
          </Button>
        </div>
      ) : (
        <PageHeader
          eyebrow={`Booking #${job.id}`}
          title={job.serviceName || 'Job Execution'}
          onBack={() => navigate(-1)}
          actions={<StatusBadge status={job.status} />}
        />
      )}

      {/* Embedded Step Action Bar */}
      {embedded && primaryCta && (
        <div className="bg-brand-ink dark:bg-gray-900 border-2 border-brand-yellow rounded-sheet p-4 shadow-sheet flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full">{primaryCta}</div>
          {canCancel && (
            <Button
              variant="danger"
              onClick={() => setConfirmCancelOpen(true)}
              leftIcon={<XCircle className="w-4 h-4" />}
              className="w-full sm:w-auto shrink-0"
            >
              {job.status === 'REQUESTED' ? 'Reject' : 'Cancel'}
            </Button>
          )}
        </div>
      )}

      <div className={`grid grid-cols-1 ${embedded ? '' : 'lg:grid-cols-12'} gap-6 items-start`}>
        {/* Left/Primary Execution Flow */}
        <div className={`${embedded ? '' : 'lg:col-span-8'} space-y-6`}>
          {job.status === 'ARRIVED' && (
            <div className="bg-gray-900 text-brand-white rounded-sheet p-6 border-2 border-brand-yellow shadow-sheet space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-card bg-brand-yellow text-brand-ink flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" strokeWidth={2.2} />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-yellow">
                    Customer Arrival Verification
                  </span>
                  <h2 className="font-display font-bold text-ds-20 text-brand-white">
                    Enter customer OTP
                  </h2>
                  <p className="text-ds-12 text-gray-400 mt-0.5">
                    Ask {job.customerName} for the 4-digit Start OTP shown on their screen.
                  </p>
                </div>
              </div>

              <OtpInput
                length={4}
                value={otpCode}
                autoFocus
                onChange={(val) => {
                  setOtpCode(val);
                  if (otpError) setOtpError('');
                }}
                onComplete={(val) => setOtpCode(val)}
                disabled={submitting}
                error={otpError}
              />
            </div>
          )}

          {job.status === 'IN_PROGRESS' && (
            <div className="bg-brand-white dark:bg-gray-900 rounded-sheet p-6 border-2 border-brand-yellow shadow-sheet space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-card bg-brand-yellow text-brand-ink flex items-center justify-center shrink-0">
                  <Wrench className="w-6 h-6" strokeWidth={2.2} />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-status-success">
                    Work Actively In Progress
                  </span>
                  <h2 className="font-display font-bold text-ds-16 text-brand-ink dark:text-brand-white">
                    Completion Notes &amp; Extras (Optional)
                  </h2>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="work-summary" className="block text-ds-12 font-bold text-gray-900 dark:text-gray-200">
                  Work Summary
                </label>
                <textarea
                  id="work-summary"
                  rows={2}
                  value={workSummary}
                  onChange={(e) => setWorkSummary(e.target.value)}
                  placeholder="e.g. Cleaned filters, replaced capacitor, tested cooling..."
                  className="w-full p-3.5 rounded-input border border-gray-200 dark:border-gray-600/40 bg-brand-white dark:bg-brand-ink text-brand-ink dark:text-brand-white text-ds-14 outline-none focus:border-brand-yellow"
                />
              </div>

              <Input
                label="Extra Parts / Charges (₹, optional)"
                type="number"
                min="0"
                value={extraCharges}
                onChange={(e) => setExtraCharges(e.target.value)}
                placeholder="0"
                helperText="Displayed on your summary; core booking amount stays server-verified."
              />
            </div>
          )}

          {/* Customer Card with Call & Open in Maps */}
          <div className="bg-brand-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600/30 rounded-card p-5 shadow-card space-y-4">
            <div className="flex items-center gap-3.5">
              <Avatar name={job.customerName || 'Customer'} size="lg" tone="yellow" />
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                  Customer
                </span>
                <h2 className="font-display font-bold text-ds-20 text-brand-ink dark:text-brand-white truncate">
                  {job.customerName || 'Customer'}
                </h2>
                <p className="text-ds-12 text-gray-600 dark:text-gray-400">
                  {job.customerPhone || 'Phone available on acceptance'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {job.customerPhone && (
                <a
                  href={`tel:${job.customerPhone}`}
                  className="min-h-[50px] px-4 py-3 rounded-card bg-brand-ink dark:bg-brand-white text-brand-white dark:text-brand-ink font-bold text-ds-14 flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                >
                  <Phone className="w-5 h-5 text-brand-yellow dark:text-brand-ink" strokeWidth={2.2} />
                  Call Customer
                </a>
              )}

              <a
                href={getGoogleMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[50px] px-4 py-3 rounded-card bg-gray-100 dark:bg-brand-ink text-brand-ink dark:text-brand-white border border-gray-200 dark:border-gray-600/40 font-bold text-ds-14 flex items-center justify-center gap-2 hover:border-brand-yellow transition-colors"
              >
                <ExternalLink className="w-5 h-5 text-brand-yellow" strokeWidth={2.2} />
                Open in Maps
              </a>
            </div>
          </div>

          {/* Address & Problem Description */}
          <div className="bg-brand-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600/30 rounded-card p-5 shadow-card space-y-4">
            <div className="grid grid-cols-2 gap-4 text-ds-14">
              <div>
                <span className="text-ds-12 font-semibold text-gray-400 block">Date &amp; Time</span>
                <span className="font-bold text-brand-ink dark:text-brand-white inline-flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-4 h-4 text-brand-yellow" /> {job.scheduledDate}
                </span>
                <span className="text-ds-12 text-gray-600 dark:text-gray-400 block pl-5">{job.scheduledTime}</span>
              </div>
              <div>
                <span className="text-ds-12 font-semibold text-gray-400 block">Est. Duration</span>
                <span className="font-bold text-brand-ink dark:text-brand-white inline-flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-4 h-4 text-brand-yellow" /> {job.estimatedDurationMins || 60} mins
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-gray-600/20 space-y-1">
              <span className="text-ds-12 font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-brand-yellow" /> Doorstep Address
              </span>
              <p className="text-ds-14 font-semibold text-brand-ink dark:text-brand-white leading-relaxed">
                {job.address}
              </p>
            </div>

            {job.description && (
              <div className="pt-3 border-t border-gray-100 dark:border-gray-600/20 space-y-1.5">
                <span className="text-ds-12 font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-brand-yellow" /> Problem Description
                </span>
                <p className="text-ds-14 text-gray-900 dark:text-gray-200 bg-gray-50 dark:bg-brand-ink p-3.5 rounded-card border border-gray-200 dark:border-gray-600/25">
                  &ldquo;{job.description}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Embedded Price Summary */}
          {embedded && (
            <div className="bg-brand-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600/30 rounded-card p-5 shadow-card space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-ds-16 text-brand-ink dark:text-brand-white">
                  Price Summary
                </h3>
                <Badge tone={job.paymentStatus === 'PAID' ? 'success' : 'warning'} dot>
                  {job.paymentMethod === 'PAY_AFTER_SERVICE' ? 'AWAITING METHOD' : job.paymentMethod} • {job.paymentStatus || 'PENDING'}
                </Badge>
              </div>
              {job.paymentUtr && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-700/40 rounded-card px-3 py-2 text-ds-12">
                  <span className="text-emerald-800 dark:text-emerald-300 font-semibold">Customer UTR: </span>
                  <span className="font-mono font-bold text-emerald-900 dark:text-emerald-200">{job.paymentUtr}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1">
                <span className="text-ds-14 text-gray-600 dark:text-gray-400">Total Job Value</span>
                <span className="font-display font-extrabold text-ds-24 text-brand-ink dark:text-brand-yellow">
                  {formatCurrency(totalDisplayAmount)}
                </span>
              </div>
            </div>
          )}

          {/* Vertical Timeline */}
          <div className="space-y-2.5">
            <h3 className="font-display font-bold text-ds-16 text-brand-ink dark:text-brand-white">
              Job Timeline
            </h3>
            <StatusTimeline
              currentStatus={job.status}
              cancelledBy={job.cancelledBy}
              reason={job.cancellationReason}
              timestamps={{
                createdAt: job.createdAt,
                acceptedAt: job.acceptedAt,
                onTheWayAt: job.onTheWayAt,
                arrivedAt: job.arrivedAt,
                inProgressAt: job.inProgressAt,
                completedAt: job.completedAt,
              }}
            />
          </div>
        </div>

        {/* Standalone Desktop Right Sticky Action & Summary Column */}
        {!embedded && (
          <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-24 space-y-5">
            {primaryCta && (
              <div className="bg-brand-white dark:bg-gray-900 border-2 border-brand-yellow rounded-sheet p-5 shadow-sheet space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                  Next Step Action
                </span>
                {primaryCta}
              </div>
            )}

            <div className="bg-brand-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600/30 rounded-card p-5 shadow-card space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-ds-16 text-brand-ink dark:text-brand-white">
                  Price Summary
                </h3>
                <Badge tone={job.paymentStatus === 'PAID' ? 'success' : 'warning'} dot>
                  {job.paymentMethod === 'PAY_AFTER_SERVICE' ? 'AWAITING METHOD' : job.paymentMethod} • {job.paymentStatus || 'PENDING'}
                </Badge>
              </div>
              {job.paymentUtr && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-700/40 rounded-card px-3 py-2 text-ds-12">
                  <span className="text-emerald-800 dark:text-emerald-300 font-semibold">Customer UTR: </span>
                  <span className="font-mono font-bold text-emerald-900 dark:text-emerald-200">{job.paymentUtr}</span>
                </div>
              )}

              <div className="space-y-2 text-ds-14">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Base service charge</span>
                  <span className="font-bold text-brand-ink dark:text-brand-white">{formatCurrency(job.amount)}</span>
                </div>
                {extraAmountNum > 0 && (
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Noted extras</span>
                    <span className="font-bold text-brand-ink dark:text-brand-white">{formatCurrency(extraAmountNum)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-600/20 flex justify-between items-center">
                  <span className="font-display font-bold text-ds-16 text-brand-ink dark:text-brand-white">Total</span>
                  <span className="font-display font-extrabold text-ds-24 text-brand-ink dark:text-brand-yellow">
                    {formatCurrency(totalDisplayAmount)}
                  </span>
                </div>
              </div>
            </div>

            {canCancel && (
              <Button
                variant="danger"
                fullWidth
                leftIcon={<XCircle className="w-5 h-5" />}
                onClick={() => setConfirmCancelOpen(true)}
              >
                {job.status === 'REQUESTED' ? 'Reject Request' : 'Cancel Job'}
              </Button>
            )}
          </aside>
        )}
      </div>

      {/* Mobile Sticky Bottom CTA Bar (< lg, standalone only) */}
      {!embedded && primaryCta && (
        <div className="lg:hidden fixed bottom-[68px] lg:bottom-0 left-0 right-0 z-30 bg-brand-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-600/30 shadow-sheet px-4 py-3">
          {primaryCta}
        </div>
      )}

      {/* Cancel / Reject ConfirmDialog */}
      <ConfirmDialog
        open={confirmCancelOpen}
        title={job.status === 'REQUESTED' ? 'Reject Request?' : 'Cancel Active Job?'}
        message="Select a reason below — the customer will be notified immediately."
        confirmLabel={job.status === 'REQUESTED' ? 'Confirm Reject' : 'Confirm Cancel'}
        cancelLabel="Keep Job"
        variant="danger"
        loading={submitting}
        onCancel={() => setConfirmCancelOpen(false)}
        onConfirm={() =>
          handleTransition(
            job.status === 'REQUESTED' ? 'REJECTED' : 'CANCELLED',
            cancelReason.trim() || 'Cancelled by provider'
          )
        }
      >
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {CANCEL_REASONS.map((r) => (
              <Chip
                key={r}
                selected={cancelReason === r}
                tone="yellow"
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
            placeholder="Optional note..."
            className="w-full p-3 rounded-input border border-gray-200 dark:border-gray-600/40 bg-brand-white dark:bg-brand-ink text-brand-ink dark:text-brand-white text-ds-12 outline-none"
          />
        </div>
      </ConfirmDialog>
    </div>
  );
};

export const ProviderJobDetailPage = () => {
  const { id } = useParams();
  return <ProviderJobDetailPanel jobId={id} />;
};
