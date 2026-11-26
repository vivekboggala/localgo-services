import React from 'react';

const TONE_CLASSES = {
  neutral: 'bg-gray-100 text-gray-900 border-gray-200 dark:bg-brand-ink dark:text-gray-200 dark:border-gray-600/40',
  ink: 'bg-brand-ink text-brand-white border-brand-ink dark:bg-brand-white dark:text-brand-ink',
  accent: 'bg-brand-yellowSoft text-brand-ink border-brand-yellow dark:bg-brand-yellow dark:text-brand-ink',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
  warning: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
  danger: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',
  info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
};

const BOOKING_STATUS_CONFIG = {
  REQUESTED: { label: 'Requested', classes: TONE_CLASSES.warning, dot: 'bg-booking-requested' },
  ACCEPTED: { label: 'Accepted', classes: TONE_CLASSES.info, dot: 'bg-booking-accepted' },
  ON_THE_WAY: { label: 'On The Way', classes: 'bg-indigo-50 text-indigo-800 border-indigo-300 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30', dot: 'bg-booking-ontheway' },
  ARRIVED: { label: 'Arrived', classes: 'bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30', dot: 'bg-booking-arrived' },
  IN_PROGRESS: { label: 'In Progress', classes: 'bg-teal-50 text-teal-800 border-teal-300 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/30', dot: 'bg-booking-inprogress' },
  COMPLETED: { label: 'Completed', classes: TONE_CLASSES.success, dot: 'bg-booking-completed' },
  CANCELLED: { label: 'Cancelled', classes: TONE_CLASSES.danger, dot: 'bg-booking-terminated' },
  REJECTED: { label: 'Rejected', classes: TONE_CLASSES.danger, dot: 'bg-booking-terminated' },
  EXPIRED: { label: 'Expired', classes: TONE_CLASSES.danger, dot: 'bg-booking-terminated' },
  VERIFIED: { label: 'Verified', classes: TONE_CLASSES.success, dot: 'bg-status-success' },
  PENDING: { label: 'Pending Review', classes: TONE_CLASSES.warning, dot: 'bg-status-warning' },
  PAID: { label: 'Paid', classes: TONE_CLASSES.success, dot: 'bg-status-success' },
  ONLINE: { label: 'Online', classes: TONE_CLASSES.success, dot: 'bg-status-success' },
  OFFLINE: { label: 'Offline', classes: TONE_CLASSES.neutral, dot: 'bg-gray-400' },
};

export const Badge = ({
  children,
  tone = 'neutral',
  dot = false,
  icon = null,
  className = '',
}) => (
  <span
    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-ds-12 font-bold border whitespace-nowrap ${
      TONE_CLASSES[tone] || TONE_CLASSES.neutral
    } ${className}`}
  >
    {dot && <span className="w-2 h-2 rounded-full bg-current opacity-85" aria-hidden="true" />}
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
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-ds-12 font-bold border whitespace-nowrap ${cfg.classes} ${className}`}
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
