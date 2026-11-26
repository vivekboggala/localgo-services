import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, RotateCcw, Star, XCircle, Eye } from 'lucide-react';
import { Avatar, Button, StatusBadge } from '../ui';
import { formatCurrency, getProviderAvatar, getServiceIconComponent } from '../../utils/helpers';

export const BookingCard = ({ booking, onCancelRequest = null }) => {
  const navigate = useNavigate();
  const ServiceIcon = getServiceIconComponent({ name: booking.serviceName });

  const canCancel = ['REQUESTED', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED'].includes(booking.status);
  const canRebook = ['COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED'].includes(booking.status);
  const canRate = booking.status === 'COMPLETED';

  const handleRebook = (e) => {
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
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/bookings/${booking.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/bookings/${booking.id}`);
        }
      }}
      className="bg-brand-white rounded-card p-4 sm:p-5 border border-gray-200 shadow-card hover:shadow-card-hover hover:border-gray-400 transition-all duration-150 cursor-pointer flex flex-col justify-between gap-4 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink"
    >
      <div className="space-y-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-card bg-brand-yellowSoft border border-brand-yellow text-brand-ink flex items-center justify-center shrink-0">
              <ServiceIcon className="w-5 h-5" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-bold text-ds-16 text-brand-ink truncate group-hover:underline">
                {booking.serviceName || 'Doorstep Service'}
              </h3>
              <span className="text-[11px] font-medium text-gray-400 block truncate">
                #{booking.id}
              </span>
            </div>
          </div>

          <StatusBadge status={booking.status} />
        </div>

        {/* Provider Row */}
        <div className="flex items-center justify-between gap-3 bg-gray-50 rounded-card px-3.5 py-2.5 border border-gray-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar
              src={getProviderAvatar(booking.providerName)}
              name={booking.providerName || 'Provider'}
              size="sm"
            />
            <div className="min-w-0">
              <p className="text-ds-12 font-bold text-brand-ink truncate">
                {booking.providerName || 'Assigned Professional'}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-gray-600 font-medium">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" strokeWidth={2} /> {booking.scheduledDate}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" strokeWidth={2} /> {booking.scheduledTime}
                </span>
              </div>
            </div>
          </div>

          <span className="font-display font-bold text-ds-16 text-brand-ink shrink-0">
            {formatCurrency(booking.amount)}
          </span>
        </div>

        {booking.description && (
          <p className="text-ds-12 text-gray-600 line-clamp-2 leading-relaxed">
            &ldquo;{booking.description}&rdquo;
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
        <Button
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/bookings/${booking.id}`);
          }}
          leftIcon={<Eye className="w-4 h-4" strokeWidth={2} />}
          className="flex-1 min-h-[44px] py-2 px-3 text-ds-12"
        >
          View
        </Button>

        {canCancel && onCancelRequest && (
          <Button
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              onCancelRequest(booking);
            }}
            leftIcon={<XCircle className="w-4 h-4" strokeWidth={2} />}
            className="flex-1 min-h-[44px] py-2 px-3 text-ds-12"
          >
            Cancel
          </Button>
        )}

        {canRebook && (
          <Button
            variant="primary"
            onClick={handleRebook}
            leftIcon={<RotateCcw className="w-4 h-4 text-brand-yellow" strokeWidth={2} />}
            className="flex-1 min-h-[44px] py-2 px-3 text-ds-12"
          >
            Rebook
          </Button>
        )}

        {canRate && (
          <Button
            variant="accent"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/bookings/${booking.id}?rate=true`);
            }}
            leftIcon={<Star className="w-4 h-4" strokeWidth={2.2} />}
            className="min-h-[44px] py-2 px-3 text-ds-12"
          >
            Rate
          </Button>
        )}
      </div>
    </div>
  );
};
