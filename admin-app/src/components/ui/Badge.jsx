import React from 'react';

const TONE_CLASSES = {
  neutral: 'bg-gray-100 text-gray-900 border-gray-200',
  ink: 'bg-brand-ink text-brand-white border-brand-ink',
  accent: 'bg-brand-yellowSoft text-brand-ink border-brand-yellow',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  danger: 'bg-rose-50 text-rose-800 border-rose-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
};

const BOOKING_STATUS_CONFIG = {
  REQUESTED: { label: 'Requested', classes: 'bg-amber-50 text-amber-800 border-amber-300', dot: 'bg-booking-requested' },
  ACCEPTED: { label: 'Accepted', classes: 'bg-blue-50 text-blue-800 border-blue-300', dot: 'bg-booking-accepted' },
  ON_THE_WAY: { label: 'On The Way', classes: 'bg-indigo-50 text-indigo-800 border-indigo-300', dot: 'bg-booking-ontheway' },
  ARRIVED: { label: 'Arrived', classes: 'bg-purple-50 text-purple-800 border-purple-300', dot: 'bg-booking-arrived' },
  IN_PROGRESS: { label: 'In Progress', classes: 'bg-teal-50 text-teal-800 border-teal-300', dot: 'bg-booking-inprogress' },
  COMPLETED: { label: 'Completed', classes: 'bg-emerald-50 text-emerald-800 border-emerald-300', dot: 'bg-booking-completed' },
  CANCELLED: { label: 'Cancelled', classes: 'bg-rose-50 text-rose-800 border-rose-200', dot: 'bg-booking-terminated' },
  REJECTED: { label: 'Rejected', classes: 'bg-rose-50 text-rose-800 border-rose-200', dot: 'bg-booking-terminated' },
  EXPIRED: { label: 'Expired', classes: 'bg-gray-100 text-rose-700 border-rose-200', dot: 'bg-booking-terminated' },
  VERIFIED: { label: 'Verified', classes: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-status-success' },
  PENDING: { label: 'Pending Review', classes: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-status-warning' },
  PAID: { label: 'Paid', classes: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-status-success' },
  ONLINE: { label: 'Online • Duty On', classes: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-status-success' },
  OFFLINE: { label: 'Offline', classes: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
};

export const Badge = ({
  children,
  tone = 'neutral',
  dot = false,
  icon = null,
  className = '',
}) => (
  <span
    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-ds-12 font-semibold border whitespace-nowrap ${
      TONE_CLASSES[tone] || TONE_CLASSES.neutral
    } ${className}`}
  >
    {dot && <span className="w-2 h-2 rounded-full bg-current opacity-80" aria-hidden="true" />}
    {icon && <span className="shrink-0 inline-flex">{icon}</span>}
    <span>{children}</span>
  </span>
);

export const StatusBadge = ({ status, showDot = true, labelOverride = null, className = '' }) => {
  const key = String(status || 'REQUESTED').toUpperCase();
  const cfg = BOOKING_STATUS_CONFIG[key] || {
    label: key.replace(/_/g, ' '),
    classes: TONE_CLASSES.neutral,
    dot: 'bg-gray-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-ds-12 font-semibold border whitespace-nowrap ${cfg.classes} ${className}`}
    >
      {showDot && (
        <span
          className={`w-2 h-2 rounded-full ${cfg.dot} ${
            key === 'ON_THE_WAY' || key === 'IN_PROGRESS' || key === 'ONLINE' ? 'animate-pulse' : ''
          }`}
          aria-hidden="true"
        />
      )}
      <span>{labelOverride || cfg.label}</span>
    </span>
  );
};

export default Badge;
