import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ShieldCheck, Heart, MapPin, Briefcase, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { favoriteService } from '../../services/favoriteService';
import { getProviderAvatar, formatCurrency } from '../../utils/helpers';
import { Avatar, Badge, Button, showToast } from '../ui';

export const ProviderCard = ({
  provider,
  isFavoriteInitial = null,
  onFavoriteToggle,
  compact = false,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(Boolean(isFavoriteInitial));
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    if (isFavoriteInitial !== null) {
      setIsFavorite(Boolean(isFavoriteInitial));
      return;
    }
    if (user && user.role === 'CUSTOMER' && provider?.id) {
      favoriteService.checkIsFavorite(provider.id)
        .then((fav) => setIsFavorite(Boolean(fav)))
        .catch(() => {});
    }
  }, [user, provider?.id, isFavoriteInitial]);

  const handleToggleFavorite = async (e) => {
    e.stopPropagation();
    if (!user || user.role !== 'CUSTOMER') {
      showToast.error('Sign in as a customer to save favorites');
      return;
    }
    setFavLoading(true);
    try {
      if (isFavorite) {
        await favoriteService.removeFavorite(provider.id);
        setIsFavorite(false);
        showToast.success(`Removed ${provider.name} from favorites`);
        onFavoriteToggle?.(provider.id, false);
      } else {
        await favoriteService.addFavorite(provider.id);
        setIsFavorite(true);
        showToast.success(`Saved ${provider.name} to favorites`);
        onFavoriteToggle?.(provider.id, true);
      }
    } catch {
      showToast.error('Failed to update favorite status');
    } finally {
      setFavLoading(false);
    }
  };

  const handleBookClick = (e) => {
    e.stopPropagation();
    if (provider.available) {
      navigate(`/book/${provider.id}`);
    } else {
      navigate(`/providers/${provider.id}`);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/providers/${provider.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/providers/${provider.id}`);
        }
      }}
      className="bg-brand-white rounded-card p-4 sm:p-5 border border-gray-200 shadow-card hover:shadow-card-hover hover:border-gray-400 transition-all duration-150 flex flex-col justify-between gap-4 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink"
    >
      <div className="space-y-3.5">
        {/* Top Row: Avatar, Identity & Favorite / Online Pill */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar
              src={provider.avatarUrl || getProviderAvatar(provider.name)}
              name={provider.name}
              size="md"
              status={provider.available ? 'online' : 'offline'}
              verified={provider.verificationStatus === 'VERIFIED'}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <h3 className="font-display font-bold text-ds-16 text-brand-ink truncate group-hover:underline">
                  {provider.name}
                </h3>
                {provider.verificationStatus === 'VERIFIED' && (
                  <ShieldCheck className="w-4 h-4 text-status-success shrink-0" strokeWidth={2.2} aria-label="Verified" />
                )}
              </div>
              <p className="text-ds-12 text-gray-600 font-medium truncate">
                {provider.services?.[0]?.name || 'Doorstep Specialist'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Badge
              tone={provider.available ? 'success' : 'neutral'}
              dot
              className="px-2.5 py-0.5 text-[11px]"
            >
              {provider.available ? 'Online' : 'Offline'}
            </Badge>

            {user?.role === 'CUSTOMER' && (
              <button
                type="button"
                onClick={handleToggleFavorite}
                disabled={favLoading}
                aria-label={isFavorite ? `Remove ${provider.name} from favorites` : `Add ${provider.name} to favorites`}
                className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-pill flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all duration-150"
              >
                <Heart
                  className={`w-5 h-5 transition-colors ${
                    isFavorite ? 'fill-status-danger text-status-danger' : 'text-gray-400 hover:text-status-danger'
                  }`}
                  strokeWidth={2}
                />
              </button>
            )}
          </div>
        </div>

        {/* Metrics Pill Strip */}
        <div className="flex flex-wrap items-center gap-2 text-ds-12 font-semibold text-brand-ink">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill bg-brand-yellowSoft border border-brand-yellow/60">
            <Star className="w-3.5 h-3.5 fill-brand-yellow text-brand-ink" strokeWidth={2} />
            {provider.rating > 0 ? Number(provider.rating).toFixed(1) : 'New'}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill bg-gray-100 text-gray-900">
            <Briefcase className="w-3.5 h-3.5 text-gray-600" strokeWidth={2} />
            {provider.completedJobs ?? 0} {(provider.completedJobs ?? 0) === 1 ? 'job' : 'jobs'}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill bg-gray-100 text-gray-900">
            <MapPin className="w-3.5 h-3.5 text-gray-600" strokeWidth={2} />
            {provider.distanceKm != null ? `${Number(provider.distanceKm).toFixed(1)} km` : (provider.serviceArea || 'Nearby')}
          </span>
        </div>

        {!compact && provider.description && (
          <p className="text-ds-12 text-gray-600 line-clamp-2 leading-relaxed">
            {provider.description}
          </p>
        )}
      </div>

      {/* Bottom Bar: Price & Book CTA */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 block">
            Starting at
          </span>
          <span className="font-display font-bold text-ds-20 text-brand-ink">
            {formatCurrency(provider.startingPrice)}
          </span>
        </div>

        <Button
          variant={provider.available ? 'accent' : 'secondary'}
          onClick={handleBookClick}
          rightIcon={<ArrowRight className="w-4 h-4" strokeWidth={2.2} />}
          className="px-5"
        >
          {provider.available ? 'Book' : 'Profile'}
        </Button>
      </div>
    </div>
  );
};
