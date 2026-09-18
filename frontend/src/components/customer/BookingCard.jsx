import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, ChevronRight, RotateCcw } from 'lucide-react';

export const BookingCard = ({ booking }) => {
  const navigate = useNavigate();

  const getStatusBadge = (st) => {
    switch (st) {
      case 'REQUESTED': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ACCEPTED': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ON_THE_WAY': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'IN_PROGRESS': return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'REJECTED': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'CANCELLED': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleBookAgain = (e) => {
    e.stopPropagation();
    navigate(`/book/${booking.providerId}?serviceId=${booking.serviceId}`, {
      state: {
        prefillDescription: booking.description,
        prefillAddress: booking.address,
        prefillLat: booking.latitude,
        prefillLng: booking.longitude,
      },
    });
  };

  return (
    <div
      onClick={() => navigate(`/bookings/${booking.id}`)}
      className="bg-white rounded-xl p-5 border border-slate-200 shadow-card hover:shadow-card-hover hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between group"
    >
      <div>
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="text-xs font-medium text-slate-500 block">Booking #{booking.id}</span>
            <h3 className="font-semibold text-slate-900 text-base group-hover:text-blue-600 transition-colors flex items-center gap-1">
              {booking.serviceName}
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Provider: {booking.providerName}</p>
          </div>
          <span className={`px-2.5 py-1 rounded text-xs font-medium border ${getStatusBadge(booking.status)}`}>
            {booking.status.replace('_', ' ')}
          </span>
        </div>

        <p className="text-xs text-slate-600 line-clamp-2 mb-4 bg-slate-50 p-2.5 rounded-md border border-slate-100">
          "{booking.description}"
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-medium text-slate-700"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {booking.scheduledDate}</span>
            <span className="flex items-center gap-1 text-slate-600"><Clock className="w-3.5 h-3.5 text-slate-400" /> {booking.scheduledTime}</span>
          </div>
          <span className="font-bold text-slate-900 text-sm">₹{booking.amount}</span>
        </div>

        {booking.status === 'COMPLETED' && (
          <button
            onClick={handleBookAgain}
            className="mt-3 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-md transition-all shadow-xs flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-400" /> Book Again
          </button>
        )}
      </div>
    </div>
  );
};

