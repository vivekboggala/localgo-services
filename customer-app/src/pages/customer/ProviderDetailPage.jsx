import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  MapPin,
  Star,
  Wrench,
  Clock,
  ArrowRight,
  ArrowLeft,
  Heart,
  Briefcase,
  Award,
} from 'lucide-react';
import { providerService } from '../../services/providerService';
import { reviewService } from '../../services/reviewService';
import { favoriteService } from '../../services/favoriteService';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../hooks/useLocation';
import { useLiveSync } from '../../hooks/useLiveSync';
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  RatingStars,
  SkeletonCard,
  showToast,
} from '../../components/ui';
import { formatCurrency, getProviderAvatar } from '../../utils/helpers';

export const ProviderDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { location } = useLocation();
  const navigate = useNavigate();

  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [reviewsNextCursor, setReviewsNextCursor] = useState(null);
  const [reviewsHasMore, setReviewsHasMore] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [loadingMoreReviews, setLoadingMoreReviews] = useState(false);

  const fetchProvider = useCallback(({ silent = false } = {}) => {
    if (!id) return;
    if (!silent) {
      setLoading(true);
      setError('');
    }
    providerService.getProviderById(id, location?.lat || null, location?.lng || null)
      .then((data) => setProvider(data))
      .catch((err) => {
        console.error(err);
        if (!silent) setError(err.response?.data?.message || 'Unable to load provider details.');
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }, [id, location?.lat, location?.lng]);

  useEffect(() => {
    fetchProvider();

    if (user?.role === 'CUSTOMER' && id) {
      favoriteService.checkIsFavorite(id)
        .then((fav) => setIsFavorite(Boolean(fav)))
        .catch(() => {});
    }

    setReviewsLoading(true);
    reviewService.getProviderReviews(id, 10, null)
      .then((data) => {
        const reviewList = Array.isArray(data) ? data : (data?.content || []);
        setReviews(reviewList);
        setReviewsNextCursor(data?.nextCursor || null);
        setReviewsHasMore(Boolean(data?.hasMore));
      })
      .catch((err) => console.error('Error fetching reviews:', err))
      .finally(() => setReviewsLoading(false));
  }, [id, user?.role, fetchProvider]);

  useLiveSync(() => fetchProvider({ silent: true }), {
    enabled: Boolean(id),
    providerId: id,
  });

  const handleLoadMoreReviews = async () => {
    if (!reviewsHasMore || !reviewsNextCursor) return;
    setLoadingMoreReviews(true);
    try {
      const data = await reviewService.getProviderReviews(id, 10, reviewsNextCursor);
      const nextList = Array.isArray(data) ? data : (data?.content || []);
      setReviews((prev) => [...prev, ...nextList]);
      setReviewsNextCursor(data?.nextCursor || null);
      setReviewsHasMore(Boolean(data?.hasMore));
    } catch {
      showToast.error('Failed to load more reviews');
    } finally {
      setLoadingMoreReviews(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user || user.role !== 'CUSTOMER') {
      showToast.error('Sign in as a customer to save favorites');
      return;
    }
    setFavLoading(true);
    try {
      if (isFavorite) {
        await favoriteService.removeFavorite(provider.id);
        setIsFavorite(false);
        showToast.success('Removed from favorites');
      } else {
        await favoriteService.addFavorite(provider.id);
        setIsFavorite(true);
        showToast.success('Saved to favorites');
      }
    } catch {
      showToast.error('Could not update favorite status');
    } finally {
      setFavLoading(false);
    }
  };

  const ratingBreakdown = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5)));
      counts[star] += 1;
    });
    const total = reviews.length || 1;
    return [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: counts[stars],
      percent: reviews.length > 0 ? Math.round((counts[stars] / total) * 100) : 0,
    }));
  }, [reviews]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <ErrorState
          title="Provider Unavailable"
          message={error || 'Provider profile could not be found.'}
          onRetry={() => fetchProvider()}
        />
      </div>
    );
  }

  return (
    <div className="pb-28 md:pb-12">
      {/* Dark Cover Header */}
      <div className="bg-brand-ink text-brand-white bg-dark-grid-pattern border-b border-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-12 space-y-5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 min-h-[42px] px-3.5 rounded-pill bg-gray-900 text-brand-white hover:bg-gray-600/30 text-ds-12 font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={2} /> Back
            </button>

            <button
              type="button"
              onClick={handleToggleFavorite}
              disabled={favLoading}
              aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
              className="w-11 h-11 rounded-pill bg-gray-900 hover:bg-gray-600/30 border border-gray-600/30 flex items-center justify-center transition-colors"
            >
              <Heart
                className={`w-5 h-5 ${isFavorite ? 'fill-status-danger text-status-danger' : 'text-brand-white'}`}
                strokeWidth={2}
              />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Avatar
              src={getProviderAvatar(provider.name)}
              name={provider.name}
              size="xl"
              status={provider.available ? 'online' : 'offline'}
              verified={provider.verificationStatus === 'VERIFIED'}
            />
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display font-bold text-ds-24 sm:text-ds-32 text-brand-white tracking-tight">
                  {provider.name}
                </h1>
                {provider.verificationStatus === 'VERIFIED' && (
                  <Badge tone="accent" icon={<ShieldCheck className="w-3.5 h-3.5" strokeWidth={2.5} />}>
                    Verified Pro
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-ds-12 text-gray-400">
                <Badge tone={provider.available ? 'success' : 'neutral'} dot>
                  {provider.available ? 'Online Now' : 'Currently Offline'}
                </Badge>
                <span className="inline-flex items-center gap-1 text-gray-200">
                  <MapPin className="w-3.5 h-3.5 text-brand-yellow" />
                  {provider.serviceArea}
                  {provider.distanceKm != null ? ` • ${Number(provider.distanceKm).toFixed(1)} km away` : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 space-y-6">
        {/* Metrics Strip Card */}
        <div className="bg-brand-white rounded-card border border-gray-200 shadow-sheet p-4 sm:p-5 grid grid-cols-3 gap-3 text-center">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
              Rating
            </span>
            <span className="font-display font-bold text-ds-20 text-brand-ink inline-flex items-center justify-center gap-1 mt-0.5">
              <Star className="w-4 h-4 fill-brand-yellow text-brand-yellow" />
              {provider.rating > 0 ? Number(provider.rating).toFixed(1) : 'New'}
            </span>
          </div>
          <div className="border-x border-gray-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
              Jobs Done
            </span>
            <span className="font-display font-bold text-ds-20 text-brand-ink inline-flex items-center justify-center gap-1 mt-0.5">
              <Briefcase className="w-4 h-4 text-gray-600" />
              {provider.completedJobs ?? 0}
            </span>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
              Experience
            </span>
            <span className="font-display font-bold text-ds-20 text-brand-ink inline-flex items-center justify-center gap-1 mt-0.5">
              <Award className="w-4 h-4 text-gray-600" />
              {provider.experienceYears ?? 0} yrs
            </span>
          </div>
        </div>

        {/* About */}
        <section className="bg-brand-white rounded-card border border-gray-200 shadow-card p-5 sm:p-6 space-y-2.5">
          <h2 className="font-display font-bold text-ds-20 text-brand-ink">About</h2>
          <p className="text-ds-14 text-gray-600 leading-relaxed">
            {provider.description || 'Verified local service specialist equipped for doorstep repairs and maintenance.'}
          </p>
        </section>

        {/* Services & Price List */}
        <section className="bg-brand-white rounded-card border border-gray-200 shadow-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-ds-20 text-brand-ink">Services &amp; Pricing</h2>
            <span className="text-ds-12 font-semibold text-gray-600">
              {provider.services?.length || 0} offered
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {provider.services?.map((s) => (
              <div key={s.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-card bg-brand-yellowSoft border border-brand-yellow text-brand-ink flex items-center justify-center shrink-0">
                    <Wrench className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-ds-14 text-brand-ink truncate">{s.name}</h3>
                    <p className="text-ds-12 text-gray-600 inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Est. {s.defaultDurationMins || 60} mins
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-display font-bold text-ds-16 text-brand-ink">
                    {formatCurrency(s.basePrice || provider.startingPrice)}
                  </span>
                  {provider.available && (
                    <Button
                      variant="secondary"
                      onClick={() => navigate(`/book/${provider.id}?serviceId=${s.id}`)}
                      className="min-h-[40px] py-1.5 px-3.5 text-ds-12"
                    >
                      Book
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Reviews with Rating Distribution Bars */}
        <section className="bg-brand-white rounded-card border border-gray-200 shadow-card p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display font-bold text-ds-20 text-brand-ink">Customer Reviews</h2>
              <p className="text-ds-12 text-gray-600">Verified feedback after completed jobs</p>
            </div>
            <div className="flex items-center gap-2 bg-brand-yellowSoft border border-brand-yellow px-3.5 py-2 rounded-card self-start">
              <Star className="w-5 h-5 fill-brand-yellow text-brand-ink" strokeWidth={2} />
              <span className="font-display font-bold text-ds-16 text-brand-ink">
                {provider.rating > 0 ? Number(provider.rating).toFixed(1) : 'New'}
              </span>
              <span className="text-ds-12 font-semibold text-gray-600">({reviews.length})</span>
            </div>
          </div>

          {reviews.length > 0 && (
            <div className="bg-gray-50 rounded-card p-4 border border-gray-100 space-y-2">
              {ratingBreakdown.map((row) => (
                <div key={row.stars} className="flex items-center gap-3 text-ds-12">
                  <span className="w-10 font-bold text-brand-ink inline-flex items-center gap-1">
                    {row.stars} <Star className="w-3 h-3 fill-brand-yellow text-brand-yellow" />
                  </span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-pill overflow-hidden">
                    <div
                      className="h-full bg-brand-yellow rounded-pill transition-all duration-300"
                      style={{ width: `${row.percent}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-semibold text-gray-600">{row.count}</span>
                </div>
              ))}
            </div>
          )}

          {reviewsLoading ? (
            <SkeletonCard />
          ) : reviews.length === 0 ? (
            <EmptyState
              icon={<Star className="w-6 h-6" strokeWidth={2} />}
              title="No reviews yet"
              description="Customer feedback appears here once completed jobs are rated."
            />
          ) : (
            <div className="space-y-4 divide-y divide-gray-100">
              {reviews.map((rev) => (
                <div key={rev.id} className="pt-4 first:pt-0 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Avatar name={rev.customerName || 'Customer'} size="sm" tone="yellow" />
                      <div>
                        <h4 className="font-display font-bold text-ds-14 text-brand-ink">
                          {rev.customerName || 'Customer'}
                        </h4>
                        <p className="text-[11px] text-gray-400">
                          {rev.createdAt
                            ? new Date(rev.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : ''}
                        </p>
                      </div>
                    </div>
                    <RatingStars rating={rev.rating} size="sm" />
                  </div>
                  {rev.comment && (
                    <p className="text-ds-14 text-gray-900 bg-gray-50 p-3 rounded-card border border-gray-100 leading-relaxed">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  )}
                </div>
              ))}

              {reviewsHasMore && (
                <div className="pt-4 flex justify-center">
                  <Button
                    variant="secondary"
                    loading={loadingMoreReviews}
                    onClick={handleLoadMoreReviews}
                  >
                    Load More Reviews
                  </Button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Sticky Bottom CTA Bar */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-30 bg-brand-white/95 backdrop-blur-md border-t border-gray-200 shadow-sheet px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
              Starting price
            </span>
            <span className="font-display font-bold text-ds-24 text-brand-ink">
              {formatCurrency(provider.startingPrice)}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleToggleFavorite}
              disabled={favLoading}
              aria-label={isFavorite ? 'Remove favorite' : 'Add to favorites'}
              className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-card border border-gray-200 bg-brand-white hover:bg-gray-50 flex items-center justify-center transition-colors"
            >
              <Heart
                className={`w-5 h-5 ${isFavorite ? 'fill-status-danger text-status-danger' : 'text-brand-ink'}`}
                strokeWidth={2}
              />
            </button>

            <Button
              variant={provider.available ? 'accent' : 'secondary'}
              size="lg"
              disabled={!provider.available}
              rightIcon={provider.available ? <ArrowRight className="w-5 h-5" strokeWidth={2.2} /> : null}
              onClick={() => navigate(`/book/${provider.id}`)}
              className="min-w-[160px] sm:min-w-[200px]"
            >
              {provider.available ? 'Book now' : 'Currently Offline'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
