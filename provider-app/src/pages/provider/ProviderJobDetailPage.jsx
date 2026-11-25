import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { providerPortalService } from '../../services/providerPortalService';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  Check,
  X,
  Navigation,
  Wrench,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  FileText,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const FLOW_STEPS = [
  { key: 'REQUESTED', label: 'Requested' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'ON_THE_WAY', label: 'On The Way' },
  { key: 'ARRIVED', label: 'Arrived' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'COMPLETED', label: 'Completed' },
];

export const ProviderJobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, firebaseUser } = useAuth();
  const uid = firebaseUser?.uid || user?.id;

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [reasonText, setReasonText] = useState('');

  useEffect(() => {
    if (!id || !uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    providerPortalService.getBookingById(id)
      .then((data) => setJob(data))
      .catch((err) => {
        console.error('Failed to load job details:', err);
      })
      .finally(() => setLoading(false));

    const docRef = doc(db, 'bookings', id);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const live = docSnap.data();
          setJob((prev) => {
            const amountInRupees = live.amount != null
              ? Number(live.amount) / 100
              : prev?.amount;
            return {
              ...(prev || {}),
              ...live,
              id: docSnap.id,
              amount: amountInRupees ?? prev?.amount,
              startOtp: undefined,
              completionOtp: undefined,
            };
          });
        }
      },
      (err) => {
        console.warn('Real-time listener warning for provider job:', err);
      }
    );

    return () => unsubscribe();
  }, [id, uid]);

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
      const updated = await providerPortalService.updateBookingStatus(id, targetStatus, reason, otp);
      if (updated) {
        setJob(updated);
      } else {
        setJob((prev) => (prev ? { ...prev, status: targetStatus } : prev));
      }
      setOtpCode('');
      setShowRejectBox(false);
      setReasonText('');
      toast.success(`Job status updated to ${targetStatus.replace(/_/g, ' ')}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not update booking status.';
      if (targetStatus === 'IN_PROGRESS' || targetStatus === 'COMPLETED') {
        setOtpError(msg);
      }
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpSubmit = (e, targetStatus) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(otpCode.trim())) {
      setOtpError('Please enter the 4-digit OTP shared by the customer.');
      return;
    }
    handleTransition(targetStatus, null, otpCode.trim());
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Request / Job Not Found</h2>
        <Link
          to="/requests"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Requests
        </Link>
      </div>
    );
  }

  const currentStepIndex = FLOW_STEPS.findIndex((s) => s.key === job.status);
  const isTerminated = job.status === 'REJECTED' || job.status === 'CANCELLED';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-xs font-mono text-slate-400">Booking #{job.id}</span>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200 inline-block mb-2">
            {job.status?.replace(/_/g, ' ')}
          </span>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{job.serviceName}</h1>
          <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            Customer: <strong className="text-slate-900">{job.customerName}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {job.customerPhone && (
            <a
              href={`tel:${job.customerPhone}`}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5" /> Call Customer
            </a>
          )}
          <a
            href={getGoogleMapsUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Maps
          </a>
        </div>
      </div>

      {!isTerminated ? (
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-4">Job Progress Flow</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {FLOW_STEPS.map((step, idx) => {
              const done = idx < currentStepIndex || job.status === 'COMPLETED';
              const active = idx === currentStepIndex && job.status !== 'COMPLETED';
              return (
                <div key={step.key} className="flex flex-col items-center text-center gap-1.5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                      done
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : active
                          ? 'bg-slate-900 border-slate-900 text-white ring-4 ring-slate-900/10'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    {done ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <span className={`text-[11px] font-semibold ${active || done ? 'text-slate-900' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-rose-900">Booking {job.status}</h3>
            {job.cancellationReason && (
              <p className="text-xs text-rose-700 mt-1">Reason: {job.cancellationReason}</p>
            )}
          </div>
        </div>
      )}

      {!isTerminated && job.status !== 'COMPLETED' && (
        <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 shadow-sm space-y-4">
          {job.status === 'REQUESTED' && (
            <>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Step 1 — Action Required</span>
                <h2 className="text-lg font-bold mt-1">Review & Accept This Booking Request</h2>
                <p className="text-xs text-slate-300 mt-1">
                  Accepting this request confirms the time slot and moves you into navigation & service execution.
                </p>
              </div>
              {!showRejectBox ? (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleTransition('ACCEPTED')}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" /> {submitting ? 'Accepting...' : 'Accept Request'}
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setShowRejectBox(true)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs border border-slate-700 inline-flex items-center gap-1.5 transition-colors"
                  >
                    <X className="w-4 h-4" /> Reject Request
                  </button>
                </div>
              ) : (
                <div className="space-y-3 bg-slate-800/80 p-4 rounded-lg border border-slate-700">
                  <label className="block text-xs font-semibold text-slate-200">Reason for rejection / cancellation (optional)</label>
                  <input
                    type="text"
                    value={reasonText}
                    onChange={(e) => setReasonText(e.target.value)}
                    placeholder="e.g. Slot unavailable or outside coverage"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-xs outline-none focus:border-white"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleTransition('REJECTED', reasonText.trim() || 'Declined by provider')}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg text-xs"
                    >
                      Confirm Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRejectBox(false)}
                      className="px-3 py-2 bg-slate-700 text-slate-200 rounded-lg text-xs font-medium"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {job.status === 'ACCEPTED' && (
            <>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Step 2 — Head to Customer</span>
                <h2 className="text-lg font-bold mt-1">Ready to Travel to Job Location</h2>
                <p className="text-xs text-slate-300 mt-1">
                  Start travel when you leave for the customer's address. The customer will be notified you are on the way.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleTransition('ON_THE_WAY', null, null, true)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Navigation className="w-4 h-4" /> Start Travel & Open Maps
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleTransition('CANCELLED', 'Cancelled by provider')}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs border border-slate-700"
                >
                  Cancel Job
                </button>
              </div>
            </>
          )}

          {job.status === 'ON_THE_WAY' && (
            <>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">Step 3 — On The Way</span>
                <h2 className="text-lg font-bold mt-1">Confirm Arrival at Customer Doorstep</h2>
                <p className="text-xs text-slate-300 mt-1">
                  Tap "I've Arrived" once you reach the service address so you can enter the Start OTP.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleTransition('ARRIVED')}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <MapPin className="w-4 h-4" /> I've Arrived
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleTransition('CANCELLED', 'Cancelled by provider')}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs border border-slate-700"
                >
                  Cancel Job
                </button>
              </div>
            </>
          )}

          {job.status === 'ARRIVED' && (
            <form onSubmit={(e) => handleOtpSubmit(e, 'IN_PROGRESS')} className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Step 4 — Verify Start OTP</span>
                <h2 className="text-lg font-bold mt-1 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" /> Enter Customer's 4-Digit Start OTP
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Ask the customer for the 4-digit Service Start OTP displayed on their booking screen.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 4));
                    if (otpError) setOtpError('');
                  }}
                  placeholder="0000"
                  className="w-36 px-3 py-2.5 text-center font-mono text-lg font-bold tracking-[0.35em] rounded-lg bg-white text-slate-900 outline-none"
                />
                <button
                  type="submit"
                  disabled={submitting || otpCode.length !== 4}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Wrench className="w-4 h-4" /> {submitting ? 'Verifying...' : 'Verify & Start Service'}
                </button>
              </div>
              {otpError && <p className="text-xs text-rose-400 font-medium">{otpError}</p>}
            </form>
          )}

          {job.status === 'IN_PROGRESS' && (
            <form onSubmit={(e) => handleOtpSubmit(e, 'COMPLETED')} className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Step 5 — Verify Completion OTP</span>
                <h2 className="text-lg font-bold mt-1 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Enter Customer's 4-Digit Completion OTP
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Once the work is finished, ask the customer for their 4-digit Completion OTP to close the job.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 4));
                    if (otpError) setOtpError('');
                  }}
                  placeholder="0000"
                  className="w-36 px-3 py-2.5 text-center font-mono text-lg font-bold tracking-[0.35em] rounded-lg bg-white text-slate-900 outline-none"
                />
                <button
                  type="submit"
                  disabled={submitting || otpCode.length !== 4}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" /> {submitting ? 'Completing...' : 'Verify & Complete Job'}
                </button>
              </div>
              {otpError && <p className="text-xs text-rose-400 font-medium">{otpError}</p>}
            </form>
          )}
        </div>
      )}

      {job.status === 'COMPLETED' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-emerald-950">Service Completed</h3>
              <p className="text-xs text-emerald-800">Amount: ₹{job.amount} ({job.paymentMethod} • {job.paymentStatus})</p>
            </div>
          </div>
          <Link
            to="/earnings"
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold text-center"
          >
            View Earnings
          </Link>
        </div>
      )}

      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Request & Customer Details</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block font-medium">Scheduled Appointment</span>
            <span className="font-semibold text-slate-900 text-sm flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> {job.scheduledDate} at {job.scheduledTime}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block font-medium">Service Amount</span>
            <span className="font-semibold text-slate-900 text-sm block mt-0.5">
              ₹{job.amount} ({job.paymentMethod} • {job.paymentStatus})
            </span>
          </div>
          <div>
            <span className="text-slate-500 block font-medium">Estimated Duration</span>
            <span className="font-semibold text-slate-900 block mt-0.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> {job.estimatedDurationMins || 60} minutes
            </span>
          </div>
          <div>
            <span className="text-slate-500 block font-medium">Customer Phone</span>
            <span className="font-semibold text-slate-900 block mt-0.5">{job.customerPhone || 'Not provided'}</span>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-500 block font-medium mb-1">Doorstep Address</span>
          <p className="text-xs text-slate-800 font-medium flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
            <span>{job.address}</span>
          </p>
        </div>

        {job.description && (
          <div>
            <span className="text-xs text-slate-500 block font-medium mb-1">Customer Problem Note</span>
            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-start gap-2">
              <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <span>"{job.description}"</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
