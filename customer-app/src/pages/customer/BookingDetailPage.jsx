import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import QRCode from 'qrcode';
import {
  CheckCircle2,
  Phone,
  Star,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  Navigation,
  XCircle,
  Smartphone,
  Wallet,
  ExternalLink,
} from 'lucide-react';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { bookingService } from '../../services/bookingService';
import { providerService } from '../../services/providerService';
import { reviewService } from '../../services/reviewService';
import { ProviderMap } from '../../components/map/ProviderMap';
import {
  Avatar,
  Badge,
  Button,
  Chip,
  ConfirmDialog,
  ErrorState,
  Modal,
  PageHeader,
  RatingStars,
  SkeletonCard,
  StatusBadge,
  StatusTimeline,
  showToast,
} from '../../components/ui';
import { formatCurrency, getProviderAvatar } from '../../utils/helpers';

const CANCEL_REASONS = [
  'Booked by mistake',
  'Provider delayed',
  'Found another pro',
  'Plans changed',
];

const REVIEW_TAGS = [
  'Punctual',
  'Professional',
  'Clean work',
  'Fair pricing',
  'Friendly',
];

const UPI_VPA = 'vivekreddy9390799974-8@ybl';
const isMobileDevice = () =>
  typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

export const BookingDetailPage = () => {
  const { id } = useParams();
  const { user, firebaseUser } = useAuth();
  const uid = firebaseUser?.uid || user?.id;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isJustConfirmed = searchParams.get('confirmed') === 'true';
  const openRateOnLoad = searchParams.get('rate') === 'true';

  const [booking, setBooking] = useState(null);
  const [liveProvider, setLiveProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cancel ConfirmDialog state
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Review Modal state
  const [showReviewModal, setShowReviewModal] = useState(openRateOnLoad);
  const [reviewRating, setReviewRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState([]);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Post-completion Payment state
  const [selectedPayMethod, setSelectedPayMethod] = useState('UPI');
  const [utrInput, setUtrInput] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const mobileDevice = useMemo(() => isMobileDevice(), []);

  const loadBooking = () => {
    if (!id || !uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    bookingService.getBookingById(id)
      .then((data) => setBooking(data))
      .catch((err) => {
        console.error('Failed to fetch booking details:', err);
        setError(err.response?.data?.message || 'Unable to load booking details.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBooking();
    if (!id || !uid) return undefined;

    const docRef = doc(db, 'bookings', id);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const liveData = docSnap.data();
          setBooking((prev) => {
            const amountInRupees = liveData.amount != null ? Number(liveData.amount) / 100 : (prev?.amount ?? 0);
            const extraInRupees =
              liveData.extraAmountPaise != null
                ? Number(liveData.extraAmountPaise) / 100
                : (prev?.extraAmount ?? 0);
            return {
              ...(prev || {}),
              ...liveData,
              id: docSnap.id,
              amount: amountInRupees,
              extraAmount: extraInRupees,
              totalAmount: amountInRupees + extraInRupees,
              startOtp: liveData.startOtp ?? prev?.startOtp,
              status: liveData.status || prev?.status,
              cancelledBy: liveData.cancelledBy ?? prev?.cancelledBy,
              cancellationReason: liveData.cancellationReason ?? prev?.cancellationReason,
            };
          });
        }
      },
      (err) => {
        console.warn('Real-time listener warning:', err);
      }
    );

    const otpSecretRef = doc(db, 'bookings', id, 'secrets', 'otp');
    const unsubscribeOtp = onSnapshot(
      otpSecretRef,
      (secretSnap) => {
        if (secretSnap.exists() && secretSnap.data()?.startOtp) {
          setBooking((prev) => (prev ? { ...prev, startOtp: secretSnap.data().startOtp } : prev));
        }
      },
      () => {}
    );

    return () => {
      unsubscribe();
      unsubscribeOtp();
    };
  }, [id, uid]);

  useEffect(() => {
    if (!booking?.providerId) return;
    if (['ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'REQUESTED', 'IN_PROGRESS'].includes(booking.status)) {
      providerService.getProviderById(booking.providerId)
        .then((p) => setLiveProvider(p))
        .catch(() => {});
    }
  }, [booking?.providerId, booking?.status]);

  useEffect(() => {
    if (booking?.paymentMethod === 'CASH' || booking?.paymentMethod === 'UPI') {
      setSelectedPayMethod(booking.paymentMethod);
    }
    if (booking?.paymentUtr) {
      setUtrInput((prev) => prev || booking.paymentUtr);
    }
  }, [booking?.paymentMethod, booking?.paymentUtr]);

  const payableAmount = useMemo(() => {
    if (!booking) return 0;
    if (booking.totalAmount != null) return Number(booking.totalAmount);
    return Number(booking.amount || 0) + Number(booking.extraAmount || 0);
  }, [booking]);

  const upiUri = useMemo(() => {
    if (!booking) return '';
    const amountStr = payableAmount.toFixed(2);
    const note = encodeURIComponent(`LocalGo Booking ${booking.id}`);
    return `upi://pay?pa=${UPI_VPA}&pn=LocalGo%20Services&am=${amountStr}&cu=INR&tn=${note}`;
  }, [booking, payableAmount]);

  useEffect(() => {
    if (!upiUri || booking?.status !== 'COMPLETED' || booking?.paymentStatus === 'PAID') {
      return;
    }
    let active = true;
    QRCode.toDataURL(upiUri, { width: 220, margin: 2 })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [upiUri, booking?.status, booking?.paymentStatus]);

  const handleSubmitPayment = async (method) => {
    if (method === 'UPI' && (!utrInput || utrInput.trim().length < 6)) {
      showToast.error('Enter a valid UTR / transaction reference number (min 6 characters).');
      return;
    }
    setSubmittingPayment(true);
    try {
      const updated = await bookingService.submitPayment(
        id,
        method,
        method === 'UPI' ? utrInput.trim() : null
      );
      setBooking(updated);
      showToast.success(
        method === 'UPI'
          ? 'UTR submitted! Provider will verify and mark as paid.'
          : 'Cash payment selected. Please pay the provider.'
      );
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to submit payment details.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const updated = await bookingService.cancelBooking(id, cancelReason || 'Cancelled by customer');
      setBooking(updated);
      setShowCancelDialog(false);
      showToast.success('Booking cancelled.');
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Cancellation failed.');
    } finally {
      setCancelling(false);
    }
  };

  const toggleReviewTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    const tagPrefix = selectedTags.length > 0 ? `[${selectedTags.join(' • ')}] ` : '';
    const fullComment = `${tagPrefix}${reviewComment.trim()}`.trim();

    try {
      await reviewService.submitReview(booking.id, reviewRating, fullComment);
      setReviewSubmitted(true);
      setShowReviewModal(false);
      showToast.success('Thank you! Your review has been submitted.');
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <ErrorState
          title="Booking Unavailable"
          message={error || 'Booking not found.'}
          onRetry={loadBooking}
        />
      </div>
    );
  }

  const canCallProvider = ['ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status);
  const canCancel = ['REQUESTED', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED'].includes(booking.status);
  const otpDigits = String(booking.startOtp || '').padEnd(4, ' ').slice(0, 4).split('');

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)] pb-14">
      {/* Full-Width Dark Header */}
      <div className="bg-brand-ink text-brand-white bg-dark-grid-pattern border-b border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <PageHeader
            title={booking.serviceName || 'Booking Trip'}
            subtitle={`Booking #${booking.id}`}
            onBack={() => navigate(-1)}
            actions={<StatusBadge status={booking.status} />}
            className="text-brand-white [&_h1]:text-brand-white [&_p]:text-gray-400 [&_button]:bg-gray-900 [&_button]:text-brand-white [&_button]:border-gray-600/30"
          />
        </div>
      </div>

      {/* Main 2-Column Website Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        {isJustConfirmed && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-card p-4 text-emerald-900 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-status-success shrink-0" strokeWidth={2.2} />
            <div>
              <h2 className="font-display font-bold text-ds-14">Booking request sent!</h2>
              <p className="text-ds-12 text-emerald-800">
                We&apos;ve notified {booking.providerName}. Live tracking updates appear below.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT (7 Cols): Large Live Map + Vertical StatusTimeline */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-brand-white rounded-sheet border border-gray-200 shadow-card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-2">
                <span className="font-display font-bold text-ds-14 text-brand-ink inline-flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Live Service Location
                </span>
                {booking.status === 'ON_THE_WAY' && (
                  <span className="px-3 py-1 rounded-pill bg-brand-ink text-brand-yellow text-[11px] font-bold inline-flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 animate-pulse" /> Pro is on the way
                  </span>
                )}
              </div>
              <div className="h-72 sm:h-80 lg:h-[380px] w-full">
                <ProviderMap
                  customerLocation={
                    booking.latitude && booking.longitude
                      ? { lat: booking.latitude, lng: booking.longitude }
                      : null
                  }
                  providers={liveProvider ? [liveProvider] : []}
                  selectedProvider={liveProvider}
                />
              </div>
            </div>

            <div className="bg-brand-white rounded-card border border-gray-200 shadow-card p-6 space-y-3">
              <h3 className="font-display font-bold text-ds-20 text-brand-ink">Live Progress</h3>
              <StatusTimeline
                currentStatus={booking.status}
                cancelledBy={booking.cancelledBy}
                reason={booking.cancellationReason}
                timestamps={{
                  createdAt: booking.createdAt,
                  acceptedAt: booking.acceptedAt,
                  onTheWayAt: booking.onTheWayAt,
                  arrivedAt: booking.arrivedAt,
                  inProgressAt: booking.inProgressAt,
                  completedAt: booking.completedAt,
                }}
              />
            </div>
          </div>

          {/* RIGHT (5 Cols, Sticky): Provider Card, Start OTP, Summary, Actions */}
          <aside className="lg:col-span-5 lg:sticky lg:top-24 space-y-5">
            {/* Large 4-Digit Start OTP Card */}
            {['ACCEPTED', 'ON_THE_WAY', 'ARRIVED'].includes(booking.status) && booking.startOtp && (
              <div className="bg-brand-ink text-brand-white rounded-sheet p-5 space-y-4 border border-gray-900 shadow-sheet">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-card bg-brand-yellow text-brand-ink flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" strokeWidth={2.2} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand-yellow">
                      Arrival Security Code
                    </span>
                    <h3 className="font-display font-bold text-ds-16 text-brand-white">
                      Start OTP
                    </h3>
                    <p className="text-ds-12 text-gray-400 mt-0.5">
                      Share only when the pro arrives at your doorstep
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 pt-1">
                  {otpDigits.map((d, i) => (
                    <div
                      key={i}
                      className="h-14 sm:h-16 rounded-card bg-brand-yellow text-brand-ink font-display font-extrabold text-ds-24 sm:text-ds-32 flex items-center justify-center shadow-card"
                    >
                      {d}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Provider Card with Call Button */}
            <div className="bg-brand-white rounded-card p-5 border border-gray-200 shadow-card flex flex-col sm:flex-row lg:flex-col xl:flex-row sm:items-center lg:items-stretch xl:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  src={getProviderAvatar(booking.providerName)}
                  name={booking.providerName || 'Provider'}
                  size="lg"
                  verified
                />
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block">
                    Assigned Professional
                  </span>
                  <h3 className="font-display font-bold text-ds-16 text-brand-ink truncate">
                    {booking.providerName}
                  </h3>
                  <p className="text-ds-12 text-gray-600 truncate">{booking.serviceName}</p>
                </div>
              </div>

              {canCallProvider && booking.providerPhone && (
                <a
                  href={`tel:${booking.providerPhone}`}
                  className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-2.5 rounded-card bg-brand-ink hover:bg-gray-900 text-brand-white font-semibold text-ds-14 transition-colors shrink-0"
                >
                  <Phone className="w-4 h-4 text-brand-yellow" strokeWidth={2.2} />
                  Call Pro
                </a>
              )}
            </div>

            {/* Completed Rate Prompt */}
            {booking.status === 'COMPLETED' && (
              <div className="bg-brand-yellowSoft border border-brand-yellow rounded-card p-5 flex items-center justify-between gap-4 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-card bg-brand-ink text-brand-yellow flex items-center justify-center shrink-0">
                    <Star className="w-5 h-5 fill-brand-yellow" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-ds-16 text-brand-ink">Rate your service</h4>
                    <p className="text-ds-12 text-gray-900">Share feedback for {booking.providerName}</p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  disabled={reviewSubmitted}
                  onClick={() => setShowReviewModal(true)}
                  className="shrink-0"
                >
                  {reviewSubmitted ? 'Submitted' : 'Rate'}
                </Button>
              </div>
            )}

            {/* Post-Completion Payment Selection (UPI QR + UTR or Cash) */}
            {booking.status === 'COMPLETED' && booking.paymentStatus !== 'PAID' && (
              <div className="bg-brand-white rounded-card border-2 border-brand-yellow shadow-card p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block">
                      Job Completed • Payment Due
                    </span>
                    <h3 className="font-display font-bold text-ds-18 text-brand-ink">
                      Pay {formatCurrency(payableAmount)}
                    </h3>
                  </div>
                  <Badge tone="warning" dot>PENDING</Badge>
                </div>

                {/* Method Toggle */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedPayMethod('UPI')}
                    className={`p-3 rounded-card border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      selectedPayMethod === 'UPI'
                        ? 'bg-brand-yellowSoft border-brand-yellow shadow-card'
                        : 'bg-brand-white border-gray-200 hover:border-brand-ink'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-brand-ink shrink-0" />
                    <div>
                      <div className="font-display font-bold text-ds-14 text-brand-ink">UPI</div>
                      <div className="text-[11px] text-gray-600">Scan QR &amp; enter UTR</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPayMethod('CASH')}
                    className={`p-3 rounded-card border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      selectedPayMethod === 'CASH'
                        ? 'bg-brand-yellowSoft border-brand-yellow shadow-card'
                        : 'bg-brand-white border-gray-200 hover:border-brand-ink'
                    }`}
                  >
                    <Wallet className="w-4 h-4 text-brand-ink shrink-0" />
                    <div>
                      <div className="font-display font-bold text-ds-14 text-brand-ink">Cash</div>
                      <div className="text-[11px] text-gray-600">Pay directly to pro</div>
                    </div>
                  </button>
                </div>

                {selectedPayMethod === 'UPI' ? (
                  <div className="space-y-4 pt-1">
                    {/* QR Code */}
                    <div className="bg-gray-50 border border-gray-200 rounded-card p-4 flex flex-col items-center text-center gap-3">
                      {qrDataUrl && (
                        <img
                          src={qrDataUrl}
                          alt="UPI Payment QR Code"
                          className="w-48 h-48 rounded-card border border-gray-200 bg-white p-2"
                        />
                      )}

                      {/* Deep-link button ONLY on mobile devices */}
                      {mobileDevice && (
                        <a
                          href={upiUri}
                          className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-card bg-brand-ink text-brand-yellow font-semibold text-ds-14 hover:bg-gray-900 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Pay {formatCurrency(payableAmount)} via UPI App
                        </a>
                      )}
                    </div>

                    {/* UTR Submission */}
                    {booking.paymentMethod === 'UPI' && booking.paymentUtr ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-card p-3 space-y-1">
                        <div className="text-ds-12 font-bold text-emerald-900">
                          UTR Submitted: <span className="font-mono">{booking.paymentUtr}</span>
                        </div>
                        <p className="text-[11px] text-emerald-800">
                          Waiting for {booking.providerName} to verify and mark payment as PAID.
                        </p>
                      </div>
                    ) : null}

                    <div className="space-y-2">
                      <label className="text-ds-12 font-semibold text-gray-700 block">
                        Enter 12-digit UTR / Transaction Ref No. after paying
                      </label>
                      <input
                        type="text"
                        value={utrInput}
                        onChange={(e) => setUtrInput(e.target.value)}
                        placeholder="e.g. 412345678901"
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-card border border-gray-300 bg-white text-ds-14 font-mono focus:outline-none focus:border-brand-ink"
                      />
                      <Button
                        variant="primary"
                        fullWidth
                        loading={submittingPayment}
                        onClick={() => handleSubmitPayment('UPI')}
                      >
                        {booking.paymentUtr ? 'Update UTR for Verification' : 'Submit UTR for Verification'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    {booking.paymentMethod === 'CASH' ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-card p-3 text-ds-12 text-amber-900">
                        Cash payment selected. Hand <strong>{formatCurrency(payableAmount)}</strong> to {booking.providerName} so they can confirm receipt.
                      </div>
                    ) : (
                      <>
                        <p className="text-ds-12 text-gray-600">
                          Pay <strong>{formatCurrency(payableAmount)}</strong> in cash to {booking.providerName}.
                        </p>
                        <Button
                          variant="primary"
                          fullWidth
                          loading={submittingPayment}
                          onClick={() => handleSubmitPayment('CASH')}
                        >
                          Confirm Cash Payment
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Trip & Price Summary */}
            <div className="bg-brand-white rounded-card border border-gray-200 shadow-card p-5 space-y-4">
              <h3 className="font-display font-bold text-ds-16 text-brand-ink">Trip &amp; Price Summary</h3>

              <div className="grid grid-cols-2 gap-4 text-ds-14">
                <div className="space-y-0.5">
                  <span className="text-ds-12 text-gray-600 font-medium block">Scheduled Time</span>
                  <span className="font-bold text-brand-ink inline-flex items-center gap-1.5 text-ds-12">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    {booking.scheduledDate} at {booking.scheduledTime}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-ds-12 text-gray-600 font-medium block">Est. Duration</span>
                  <span className="font-bold text-brand-ink inline-flex items-center gap-1.5 text-ds-12">
                    <Clock className="w-4 h-4 text-gray-600" />
                    {booking.estimatedDurationMins || 60} mins
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-ds-12 text-gray-600 font-medium block">Total Amount</span>
                  <span className="font-display font-extrabold text-ds-20 text-brand-ink">
                    {formatCurrency(
                      booking.totalAmount != null
                        ? booking.totalAmount
                        : Number(booking.amount || 0) + Number(booking.extraAmount || 0)
                    )}
                  </span>
                  <span className="text-ds-12 text-gray-600 ml-1">
                    ({booking.paymentMethod === 'PAY_AFTER_SERVICE' ? 'Pay after service' : booking.paymentMethod})
                  </span>
                  {Number(booking.extraAmount || 0) > 0 && (
                    <span className="text-[11px] text-gray-600 block">
                      Base {formatCurrency(booking.amount)} + Extra fittings {formatCurrency(booking.extraAmount)}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-ds-12 text-gray-600 font-medium block">Payment Status</span>
                  <Badge tone={booking.paymentStatus === 'PAID' ? 'success' : 'warning'} dot>
                    {booking.paymentStatus || 'PENDING'}
                  </Badge>
                  {booking.paymentUtr && (
                    <p className="text-[11px] font-mono text-gray-700">UTR: {booking.paymentUtr}</p>
                  )}
                  {booking.status === 'COMPLETED' && booking.paymentStatus !== 'PAID' && booking.paymentMethod === 'CASH' && (
                    <p className="text-[11px] text-amber-800">Awaiting provider cash confirmation</p>
                  )}
                  {booking.status === 'COMPLETED' && booking.paymentStatus !== 'PAID' && booking.paymentMethod === 'UPI' && (
                    <p className="text-[11px] text-gray-600">
                      {booking.paymentUtr ? 'UTR submitted — awaiting provider verification' : 'UPI payment pending'}
                    </p>
                  )}
                </div>
              </div>

              {booking.address && (
                <div className="pt-3 border-t border-gray-100 space-y-1">
                  <span className="text-ds-12 font-semibold text-gray-600 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> Doorstep Address
                  </span>
                  <p className="text-ds-14 font-medium text-brand-ink">{booking.address}</p>
                </div>
              )}

              {booking.description && (
                <div className="pt-2 space-y-1">
                  <span className="text-ds-12 font-semibold text-gray-600 block">Problem Description</span>
                  <p className="text-ds-14 text-gray-900 bg-gray-50 p-3 rounded-card border border-gray-100">
                    &ldquo;{booking.description}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {canCancel && (
              <Button
                variant="danger"
                fullWidth
                leftIcon={<XCircle className="w-5 h-5" strokeWidth={2} />}
                onClick={() => setShowCancelDialog(true)}
              >
                Cancel Booking
              </Button>
            )}
          </aside>
        </div>
      </div>

      {/* Cancel ConfirmDialog */}
      <ConfirmDialog
        open={showCancelDialog}
        title="Cancel Booking"
        message="Choose a reason so we can keep improving matching speed:"
        confirmLabel="Confirm Cancel"
        cancelLabel="Keep Booking"
        variant="danger"
        loading={cancelling}
        onConfirm={handleCancel}
        onCancel={() => setShowCancelDialog(false)}
      >
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {CANCEL_REASONS.map((reason) => (
              <Chip
                key={reason}
                selected={cancelReason === reason}
                tone="ink"
                onClick={() => setCancelReason(reason)}
              >
                {reason}
              </Chip>
            ))}
          </div>
          <textarea
            rows={2}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Additional details (optional)..."
            className="w-full p-3 rounded-input border border-gray-200 focus:border-brand-ink outline-none text-ds-12 text-brand-ink"
          />
        </div>
      </ConfirmDialog>

      {/* Rate & Review Modal */}
      <Modal
        open={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Rate Your Experience"
        subtitle={`How did ${booking.providerName} perform on ${booking.serviceName}?`}
      >
        <form onSubmit={handleReviewSubmit} className="space-y-5">
          <div className="flex flex-col items-center py-4 bg-gray-50 rounded-card border border-gray-200 space-y-2">
            <RatingStars
              rating={reviewRating}
              interactive
              onChange={(val) => setReviewRating(val)}
              size="lg"
            />
            <span className="text-ds-14 font-bold text-brand-ink">
              {reviewRating} out of 5 stars
            </span>
          </div>

          <div className="space-y-2">
            <span className="text-ds-12 font-semibold text-gray-900 block">What stood out?</span>
            <div className="flex flex-wrap gap-2">
              {REVIEW_TAGS.map((tag) => (
                <Chip
                  key={tag}
                  selected={selectedTags.includes(tag)}
                  tone="yellow"
                  onClick={() => toggleReviewTag(tag)}
                >
                  {tag}
                </Chip>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="review-comment" className="text-ds-12 font-semibold text-gray-900 block">
              Feedback comment
            </label>
            <textarea
              id="review-comment"
              rows={3}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share details about work quality and timeliness..."
              className="w-full p-3 rounded-input border border-gray-200 focus:border-brand-ink outline-none text-ds-14 text-brand-ink"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button variant="secondary" fullWidth onClick={() => setShowReviewModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" fullWidth loading={submittingReview}>
              Submit Review
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
