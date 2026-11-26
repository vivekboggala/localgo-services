import React from 'react';
import { Check, XCircle } from 'lucide-react';

const DEFAULT_BOOKING_STEPS = [
  { key: 'REQUESTED', label: 'Requested', description: 'Waiting for provider confirmation' },
  { key: 'ACCEPTED', label: 'Accepted', description: 'Slot locked & provider assigned' },
  { key: 'ON_THE_WAY', label: 'On The Way', description: 'Professional is heading to your address' },
  { key: 'ARRIVED', label: 'Arrived', description: 'Share your 4-digit Start OTP to begin' },
  { key: 'IN_PROGRESS', label: 'In Progress', description: 'Service work actively underway' },
  { key: 'COMPLETED', label: 'Completed', description: 'Job finished & ready for review' },
];

const formatStepTime = (val) => {
  if (!val) return null;
  try {
    let d;
    if (typeof val?.toDate === 'function') {
      d = val.toDate();
    } else if (val?.seconds != null) {
      d = new Date(val.seconds * 1000);
    } else if (
      typeof val === 'string' &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(val) &&
      !/([+-]\d{2}:?\d{2}|Z)$/i.test(val)
    ) {
      // Backend LocalDateTime serializes in UTC without 'Z'; append 'Z' so browser converts to local time
      d = new Date(`${val}Z`);
    } else {
      d = new Date(val);
    }
    if (isNaN(d.getTime())) return null;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return null;
  }
};

export const Stepper = ({
  steps = DEFAULT_BOOKING_STEPS,
  currentStatus = 'REQUESTED',
  timestamps = {},
  cancelledBy = null,
  reason = null,
  className = '',
}) => {
  if (currentStatus === 'REJECTED' || currentStatus === 'CANCELLED' || currentStatus === 'EXPIRED') {
    const heading =
      currentStatus === 'REJECTED'
        ? 'Booking Rejected by Provider'
        : currentStatus === 'EXPIRED'
          ? 'Booking Request Expired'
          : `Booking Cancelled${cancelledBy ? ` (${cancelledBy})` : ''}`;

    return (
      <div className={`bg-rose-50 border border-status-danger/30 rounded-card p-5 space-y-1.5 ${className}`}>
        <div className="flex items-center gap-2 text-status-danger font-display font-bold text-ds-16">
          <XCircle className="w-5 h-5 shrink-0" strokeWidth={2} />
          <span>{heading}</span>
        </div>
        {reason && <p className="text-ds-14 text-gray-900 pl-7">{reason}</p>}
      </div>
    );
  }

  const currentIndex = Math.max(0, steps.findIndex((s) => s.key === currentStatus));

  const timeByKey = {
    REQUESTED: timestamps.createdAt,
    ACCEPTED: timestamps.acceptedAt,
    ON_THE_WAY: timestamps.onTheWayAt,
    ARRIVED: timestamps.arrivedAt,
    IN_PROGRESS: timestamps.inProgressAt,
    COMPLETED: timestamps.completedAt,
  };

  return (
    <div className={`bg-brand-white border border-gray-200 rounded-card p-5 shadow-card ${className}`}>
      <div className="space-y-0">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentIndex || (currentStatus === 'COMPLETED' && idx === currentIndex);
          const isActive = idx === currentIndex && currentStatus !== 'COMPLETED';
          const isLast = idx === steps.length - 1;
          const timeStr = formatStepTime(step.timestamp || timeByKey[step.key]);

          return (
            <div key={step.key} className="relative flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-ds-12 font-bold border-2 transition-all duration-200 z-10 ${
                    isCompleted
                      ? 'bg-status-success border-status-success text-brand-white'
                      : isActive
                        ? 'bg-brand-ink border-brand-yellow text-brand-yellow animate-step-pulse'
                        : 'bg-brand-white border-gray-200 text-gray-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" strokeWidth={2.5} /> : idx + 1}
                </div>
                {!isLast && (
                  <div
                    className={`w-0.5 flex-1 my-1 transition-colors duration-200 ${
                      isCompleted ? 'bg-status-success' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>

              <div className={`flex-1 ${!isLast ? 'pb-6' : 'pb-1'}`}>
                <div className="flex items-center justify-between gap-2 min-h-[32px]">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-display font-bold text-ds-14 ${
                        isActive || isCompleted ? 'text-brand-ink' : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </span>
                    {isActive && (
                      <span className="px-2 py-0.5 rounded-pill bg-brand-yellow text-brand-ink text-[10px] font-extrabold uppercase tracking-wider">
                        Live
                      </span>
                    )}
                  </div>
                  {timeStr && (isCompleted || isActive) && (
                    <span className="text-ds-12 font-medium text-gray-600">{timeStr}</span>
                  )}
                </div>
                {step.description && (
                  <p className={`text-ds-12 mt-0.5 ${isActive || isCompleted ? 'text-gray-600' : 'text-gray-400'}`}>
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const StatusTimeline = Stepper;
export default Stepper;
