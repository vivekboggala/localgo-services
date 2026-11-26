import React from 'react';
import { ArrowRight } from 'lucide-react';
import { getServiceIconComponent, getServiceStartingPrice } from '../../utils/helpers';

export const ServiceCard = ({ service, onClick, compact = false }) => {
  const IconComponent = getServiceIconComponent(service);
  const startingPrice = getServiceStartingPrice(service);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-brand-white rounded-card p-4 sm:p-5 border border-gray-200 shadow-card hover:shadow-card-hover hover:border-brand-ink transition-all duration-150 active:scale-[0.98] cursor-pointer group flex flex-col justify-between gap-3"
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="w-12 h-12 rounded-card bg-brand-yellowSoft border border-brand-yellow text-brand-ink flex items-center justify-center group-hover:bg-brand-ink group-hover:text-brand-yellow group-hover:border-brand-ink transition-colors duration-150 shrink-0">
            <IconComponent className="w-6 h-6" strokeWidth={2} />
          </div>
          {service.category && !compact && (
            <span className="px-2.5 py-0.5 rounded-pill bg-gray-100 text-gray-600 text-[11px] font-semibold truncate max-w-[110px]">
              {service.category}
            </span>
          )}
        </div>

        <div>
          <h3 className="font-display font-bold text-ds-16 text-brand-ink tracking-tight line-clamp-1">
            {service.name}
          </h3>
          {!compact && service.description && (
            <p className="text-ds-12 text-gray-600 line-clamp-2 mt-1 leading-relaxed">
              {service.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100 w-full">
        <span className="text-ds-12 font-bold text-brand-ink bg-brand-yellowSoft/70 px-2.5 py-1 rounded-pill">
          from Rs {startingPrice}
        </span>
        <span className="w-8 h-8 rounded-pill bg-gray-100 group-hover:bg-brand-yellow text-brand-ink flex items-center justify-center transition-colors duration-150">
          <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
        </span>
      </div>
    </button>
  );
};
