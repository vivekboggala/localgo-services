import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Check, X, Navigation, FileText } from 'lucide-react';
import { Badge, Button } from '../ui';
import {
  formatCurrency,
  getCustomerFirstName,
  getServiceIconComponent,
  parseFirestoreDate,
} from '../../utils/helpers';

const EXPIRY_WINDOW_MS = 10 * 60 * 1000;

const CountdownRing = ({ createdAt }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const createdDate = parseFirestoreDate(createdAt);
  const elapsed = createdDate ? Math.max(0, now - createdDate.getTime()) : 0;
  const remainingMs = Math.max(0, EXPIRY_WINDOW_MS - elapsed);
  const progress = Math.max(0, Math.min(1, remainingMs / EXPIRY_WINDOW_MS));

  const totalSecs = Math.ceil(remainingMs / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  const label = `${mins}:${String(secs).padStart(2, '0')}`;

  const r = 21;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference * (1 - progress);
  const strokeColor = remainingMs < 120000 ? '#F04438' : '#FFC700';

  return (
    <div className="relative w-14 h-14 flex items-center justify-center shrink-0" aria-label={`Expires in ${label}`}>
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 52 52">
        <circle
          cx="26"
          cy="26"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-gray-200 dark:text-gray-600/35"
        />
        <circle
          cx="26"
          cy="26"
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.8s linear' }}
        />
      </svg>
      <span className="absolute font-display font-extrabold text-[11px] text-brand-ink dark:text-brand-white">
        {label}
      </span>
    </div>
  );
};

export const RequestCard = ({ request, onAccept, onReject, onOpen }) => {
  const [busyAction, setBusyAction] = useState(null);
  const ServiceIcon = getServiceIconComponent(request.serviceName);
  const firstName = getCustomerFirstName(request.customerName);

  const handleAction = async (e, type) => {
    e.stopPropagation();
    setBusyAction(type);
    try {
      if (type === 'accept') await onAccept?.(request.id);
      if (type === 'reject') await onReject?.(request.id);
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div
      onClick={() => onOpen?.(request.id)}
      className={`bg-brand-white dark:bg-gray-900 rounded-sheet p-5 border-2 border-brand-yellow/60 dark:border-brand-yellow/50 shadow-sheet space-y-4 transition-all ${
        onOpen ? 'cursor-pointer hover:border-brand-yellow' : ''
      }`}
    >
      {/* Top Header: Service + Earnings Estimate + 10-Min Countdown Ring */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-12 h-12 rounded-card bg-brand-yellow text-brand-ink flex items-center justify-center shrink-0 shadow-card">
            <ServiceIcon className="w-6 h-6" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display font-bold text-ds-16 text-brand-ink dark:text-brand-white truncate">
                {request.serviceName || 'Service Request'}
              </h3>
              <Badge tone="accent">{formatCurrency(request.amount)} est.</Badge>
            </div>
            <p className="text-ds-14 font-semibold text-gray-900 dark:text-gray-200 mt-0.5">
              {firstName}
              {request.distanceKm != null ? (
                <span className="text-gray-600 dark:text-gray-400 font-medium">
                  {' '}• {Number(request.distanceKm).toFixed(1)} km away
                </span>
              ) : null}
            </p>
          </div>
        </div>

        <CountdownRing createdAt={request.createdAt} />
      </div>

      {/* Trip & Location Summary */}
      <div className="bg-gray-50 dark:bg-brand-ink rounded-card p-3.5 border border-gray-200 dark:border-gray-600/30 space-y-2 text-ds-12">
        <div className="flex items-start gap-2 text-brand-ink dark:text-brand-white font-semibold">
          <MapPin className="w-4 h-4 text-brand-yellow shrink-0 mt-0.5" strokeWidth={2.2} />
          <span>{request.city ? `${request.address} (${request.city})` : request.address}</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-400 font-medium">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-brand-yellow" /> {request.scheduledDate}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-brand-yellow" /> {request.scheduledTime}
          </span>
          {request.distanceKm != null && (
            <span className="inline-flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-status-success" /> {Number(request.distanceKm).toFixed(1)} km
            </span>
          )}
        </div>

        {request.description && (
          <div className="flex items-start gap-2 pt-2 border-t border-gray-200 dark:border-gray-600/20 text-gray-900 dark:text-gray-200">
            <FileText className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
            <span className="line-clamp-2">&ldquo;{request.description}&rdquo;</span>
          </div>
        )}
      </div>

      {/* Large Accept (Yellow) & Reject (Outline) Outdoor Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          loading={busyAction === 'reject'}
          disabled={Boolean(busyAction)}
          leftIcon={<X className="w-5 h-5 text-status-danger" strokeWidth={2.4} />}
          onClick={(e) => handleAction(e, 'reject')}
        >
          Reject
        </Button>

        <Button
          variant="accent"
          size="lg"
          fullWidth
          loading={busyAction === 'accept'}
          disabled={Boolean(busyAction)}
          leftIcon={<Check className="w-5 h-5" strokeWidth={2.6} />}
          onClick={(e) => handleAction(e, 'accept')}
        >
          Accept
        </Button>
      </div>
    </div>
  );
};

export default RequestCard;
