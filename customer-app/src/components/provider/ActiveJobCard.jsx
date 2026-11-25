import React, { useState } from 'react';
import { Phone, Navigation, Wrench, CheckCircle2, Calendar, MapPin, ExternalLink, Clock, User, ShieldCheck } from 'lucide-react';

export const ActiveJobCard = ({ job, onUpdateStatus, onCancelJob }) => {
  const [otpTargetStatus, setOtpTargetStatus] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getGoogleMapsUrl = () => {
    if (job.latitude && job.longitude) {
      let url = `https://www.google.com/maps/dir/?api=1&destination=${job.latitude},${job.longitude}`;
      if (job.providerLatitude && job.providerLongitude) {
        url += `&origin=${job.providerLatitude},${job.providerLongitude}`;
      }
      return url;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.address || '')}`;
  };

  const handleStartTravel = async () => {
    const mapsUrl = getGoogleMapsUrl();
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    setSubmitting(true);
    try {
      await onUpdateStatus(job.id, 'ON_THE_WAY');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenMapsOnly = () => {
    const mapsUrl = getGoogleMapsUrl();
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSimpleStatus = async (nextStatus) => {
    setSubmitting(true);
    try {
      await onUpdateStatus(job.id, nextStatus);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(otpCode.trim())) {
      setOtpError('Please enter the 4-digit OTP shared by the customer.');
      return;
    }
    setOtpError('');
    setSubmitting(true);
    try {
      await onUpdateStatus(job.id, otpTargetStatus, otpCode.trim());
      setOtpTargetStatus(null);
      setOtpCode('');
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Invalid OTP. Please ask the customer again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = () => {
    switch (job.status) {
      case 'ACCEPTED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">Accepted</span>;
      case 'ON_THE_WAY':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse">On The Way</span>;
      case 'ARRIVED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Arrived at Location</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">In Progress</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">Completed</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">{job.status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Job #{job.id}</span>
          <h3 className="font-bold text-slate-900 text-base">{job.serviceName}</h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>Customer: <strong className="text-slate-900">{job.customerName}</strong></span>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-2">
        <div className="flex items-start gap-1.5 text-slate-800">
          <MapPin className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold block">Service Destination</span>
            <span className="text-slate-600">{job.address}</span>
            {job.distanceKm != null && (
              <span className="text-[11px] font-medium text-blue-600 block mt-0.5">
                Distance: {job.distanceKm} km from your registered location
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-600 pt-1 border-t border-slate-200/60">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> {job.scheduledDate}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" /> {job.scheduledTime} ({job.estimatedDurationMins}m)
          </span>
        </div>

        {job.description && (
          <div className="pt-1.5 border-t border-slate-200/60 text-slate-700">
            <span className="font-semibold text-slate-900">Note:</span> "{job.description}"
          </div>
        )}

        <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
          <a
            href={`tel:${job.customerPhone}`}
            className="inline-flex items-center gap-1.5 font-semibold text-slate-900 hover:text-blue-600 transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-slate-500" />
            Call Customer ({job.customerPhone})
          </a>
          <span className="font-bold text-slate-900 text-sm">₹{job.amount} ({job.paymentMethod})</span>
        </div>
      </div>

      {otpTargetStatus && (
        <form onSubmit={handleOtpSubmit} className="bg-slate-50 border border-slate-300 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>
              {otpTargetStatus === 'IN_PROGRESS'
                ? 'Enter Customer 4-Digit Service Start OTP'
                : 'Enter Customer 4-Digit Service Completion OTP'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={otpCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                setOtpCode(val);
                if (otpError) setOtpError('');
              }}
              placeholder="4-digit OTP"
              autoFocus
              className="w-36 px-3 py-2 text-center font-mono text-base font-bold tracking-[0.3em] rounded-lg border border-slate-300 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-slate-900"
            />
            <button
              type="submit"
              disabled={submitting || otpCode.length !== 4}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition-colors disabled:opacity-50"
            >
              {submitting ? 'Verifying...' : 'Verify & Confirm'}
            </button>
            <button
              type="button"
              onClick={() => {
                setOtpTargetStatus(null);
                setOtpCode('');
                setOtpError('');
              }}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-600 font-medium rounded-lg text-xs border border-slate-200"
            >
              Cancel
            </button>
          </div>
          {otpError && <p className="text-xs font-medium text-red-600">{otpError}</p>}
        </form>
      )}

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
        {job.status === 'ACCEPTED' && (
          <>
            <button
              onClick={() => onCancelJob(job.id)}
              disabled={submitting}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-xs border border-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleStartTravel}
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs disabled:opacity-50"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-400" /> Start Travel & Navigate
            </button>
          </>
        )}

        {job.status === 'ON_THE_WAY' && (
          <>
            <button
              onClick={handleOpenMapsOnly}
              className="flex items-center gap-1 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-xs border border-slate-200 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" /> Open Maps
            </button>
            <button
              onClick={() => onCancelJob(job.id)}
              disabled={submitting}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-xs border border-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSimpleStatus('ARRIVED')}
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs disabled:opacity-50"
            >
              <MapPin className="w-3.5 h-3.5" /> I've Arrived
            </button>
          </>
        )}

        {job.status === 'ARRIVED' && !otpTargetStatus && (
          <>
            <button
              onClick={handleOpenMapsOnly}
              className="flex items-center gap-1 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-xs border border-slate-200 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" /> Open Maps
            </button>
            <button
              onClick={() => {
                setOtpTargetStatus('IN_PROGRESS');
                setOtpCode('');
                setOtpError('');
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs"
            >
              <Wrench className="w-3.5 h-3.5 text-amber-400" /> Start Service (OTP)
            </button>
          </>
        )}

        {job.status === 'IN_PROGRESS' && !otpTargetStatus && (
          <button
            onClick={() => {
              setOtpTargetStatus('COMPLETED');
              setOtpCode('');
              setOtpError('');
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Complete Service (OTP)
          </button>
        )}
      </div>
    </div>
  );
};
