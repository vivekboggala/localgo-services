import React from 'react';
import { Calendar, Clock, MapPin, Check, X, FileText } from 'lucide-react';

export const RequestCard = ({ request, onAccept, onReject }) => {
  return (
    <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-medium text-slate-500 block">Booking #{request.id}</span>
          <h3 className="font-semibold text-slate-900 text-base">{request.serviceName}</h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Customer: <span className="font-medium text-slate-900">{request.customerName}</span> ({request.customerPhone})
          </p>
        </div>
        <span className="px-2.5 py-1 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          Pending
        </span>
      </div>

      <div className="bg-slate-50 p-3 rounded.lg border border-slate-200 text-xs text-slate-700 space-y-1.5">
        <div className="flex items-start gap-1.5">
          <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
          <span><span className="font-medium text-slate-900">Note:</span> "{request.description}"</span>
        </div>
        <div className="flex items-start gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
          <span>{request.address}</span>
        </div>
        <div className="flex items-center gap-3 text-slate-600 pt-0.5">
          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {request.scheduledDate}</span>
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" /> {request.scheduledTime} ({request.estimatedDurationMins}m)</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-baseline gap-1">
          <span className="text-base font-bold text-slate-900">₹{request.amount}</span>
          <span className="text-xs text-slate-500">({request.paymentMethod})</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onReject(request.id)}
            className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-xs transition-colors border border-slate-200"
          >
            <X className="w-3.5 h-3.5 text-slate-500" /> Reject
          </button>
          <button
            onClick={() => onAccept(request.id)}
            className="flex items-center gap-1 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-xs transition-colors"
          >
            <Check className="w-3.5 h-3.5" /> Accept
          </button>
        </div>
      </div>
    </div>
  );
};
