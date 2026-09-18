import React from 'react';
import { Phone, Navigation, Wrench, CheckCircle2, Calendar, MapPin } from 'lucide-react';

export const ActiveJobCard = ({ job, onUpdateStatus, onCancelJob }) => {
  return (
    <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-medium text-slate-500 block">Job #{job.id}</span>
          <h3 className="font-semibold text-slate-900 text-base">{job.serviceName}</h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Customer: <span className="font-medium text-slate-900">{job.customerName}</span>
          </p>
        </div>
        <span className="px-2.5 py-1 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
          {job.status.replace('_', ' ')}
        </span>
      </div>

      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-2">
        <div className="flex items-start gap-1.5 text-slate-700">
          <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
          <span>{job.address}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{job.scheduledDate} at {job.scheduledTime}</span>
        </div>
        <div className="pt-1 border-t border-slate-200/60">
          <a href={`tel:${job.customerPhone}`} className="inline-flex items-center gap-1.5 font-medium text-slate-900 hover:underline">
            <Phone className="w-3.5 h-3.5 text-slate-500" />
            Call Customer ({job.customerPhone})
          </a>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <span className="text-base font-bold text-slate-900">₹{job.amount}</span>

        <div className="flex items-center gap-2">
          {job.status === 'ACCEPTED' && (
            <>
              <button
                onClick={() => onCancelJob(job.id)}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-xs border border-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onUpdateStatus(job.id, 'ON_THE_WAY')}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-xs transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" /> On The Way
              </button>
            </>
          )}

          {job.status === 'ON_THE_WAY' && (
            <>
              <button
                onClick={() => onCancelJob(job.id)}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-xs border border-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onUpdateStatus(job.id, 'IN_PROGRESS')}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-xs transition-colors"
              >
                <Wrench className="w-3.5 h-3.5" /> Start Service
              </button>
            </>
          )}

          {job.status === 'IN_PROGRESS' && (
            <button
              onClick={() => onUpdateStatus(job.id, 'COMPLETED')}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-xs transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Complete Service
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
