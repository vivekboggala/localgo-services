import React from 'react';
import { Check, XCircle, AlertCircle } from 'lucide-react';

const STEPS = [
  { key: 'REQUESTED', label: 'Requested', desc: 'Booking submitted' },
  { key: 'ACCEPTED', label: 'Accepted', desc: 'Accepted by provider' },
  { key: 'ON_THE_WAY', label: 'On The Way', desc: 'Provider en route' },
  { key: 'IN_PROGRESS', label: 'In Progress', desc: 'Service execution active' },
  { key: 'COMPLETED', label: 'Completed', desc: 'Service finished' },
];

export const StatusTimeline = ({ status, cancelledBy, cancellationReason }) => {
  if (status === 'REJECTED' || status === 'CANCELLED') {
    return (
      <div className="bg-slate-100 border border-slate-300 rounded-lg p-4 text-slate-800 space-y-1">
        <div className="flex items-center gap-2 font-bold text-xs text-red-700">
          <XCircle className="w-4 h-4" />
          <span>{status === 'REJECTED' ? 'Booking Rejected by Provider' : `Booking Cancelled by ${cancelledBy || 'User'}`}</span>
        </div>
        {cancellationReason && (
          <p className="text-xs text-slate-600 pl-6">Reason: {cancellationReason}</p>
        )}
      </div>
    );
  }

  const getStepIndex = (st) => STEPS.findIndex((s) => s.key === st);
  const currentIndex = getStepIndex(status);

  return (
    <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm space-y-4">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Timeline</h3>

      <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
        {STEPS.map((step, idx) => {
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step.key} className="relative">
              <div
                className={`absolute -left-[31px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                  isCurrent
                    ? 'bg-slate-900 text-white border-slate-900'
                    : isDone
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-400 border-slate-300'
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </div>

              <div>
                <h4 className={`text-xs font-bold ${isCurrent ? 'text-slate-900 font-extrabold' : isDone ? 'text-slate-900' : 'text-slate-400'}`}>
                  {step.label}
                  {isCurrent && <span className="ml-2 text-[10px] bg-slate-100 border border-slate-300 text-slate-800 px-2 py-0.5 rounded font-bold uppercase">Active</span>}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
