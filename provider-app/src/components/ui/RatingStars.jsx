import React, { useState } from 'react';
import { Star } from 'lucide-react';

export const RatingStars = ({
  rating = 0,
  maxStars = 5,
  interactive = false,
  onChange,
  showValue = false,
  reviewCount = null,
  size = 'md',
  className = '',
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const displayRating = interactive && hoverRating > 0 ? hoverRating : Number(rating) || 0;

  const starSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div
        className="inline-flex items-center gap-0.5"
        role={interactive ? 'radiogroup' : undefined}
        aria-label={interactive ? 'Select star rating' : `Rated ${displayRating} out of ${maxStars} stars`}
      >
        {Array.from({ length: maxStars }, (_, idx) => {
          const starVal = idx + 1;
          const filled = starVal <= Math.round(displayRating);

          if (!interactive) {
            return (
              <Star
                key={starVal}
                className={`${starSize} ${filled ? 'fill-brand-yellow text-brand-yellow' : 'text-gray-200 fill-gray-100'}`}
                strokeWidth={2}
                aria-hidden="true"
              />
            );
          }

          return (
            <button
              key={starVal}
              type="button"
              role="radio"
              aria-checked={starVal === Math.round(rating)}
              aria-label={`${starVal} star${starVal > 1 ? 's' : ''}`}
              onClick={() => onChange?.(starVal)}
              onMouseEnter={() => setHoverRating(starVal)}
              onMouseLeave={() => setHoverRating(0)}
              className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-card inline-flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all duration-150"
            >
              <Star
                className={`w-6 h-6 ${filled ? 'fill-brand-yellow text-brand-yellow' : 'text-gray-400'}`}
                strokeWidth={2}
              />
            </button>
          );
        })}
      </div>

      {showValue && (
        <span className="text-ds-14 font-bold text-brand-ink">
          {Number(rating) > 0 ? Number(rating).toFixed(1) : 'New'}
        </span>
      )}
      {reviewCount !== null && reviewCount !== undefined && (
        <span className="text-ds-12 text-gray-600 font-medium">({reviewCount})</span>
      )}
    </div>
  );
};

export default RatingStars;
