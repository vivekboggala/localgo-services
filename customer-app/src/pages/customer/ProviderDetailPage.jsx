import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { providerService } from '../../services/providerService';
import { reviewService } from '../../services/reviewService';
import { RatingStars } from '../../components/common/RatingStars';
import { useAuth } from '../../hooks/useAuth';
import { ShieldCheck, MapPin, Calendar, Star, Wrench, Clock, ArrowRight } from 'lucide-react';

export const ProviderDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    providerService.getProviderById(id)
      .then((data) => setProvider(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    setReviewsLoading(true);
    reviewService.getProviderReviews(id)
      .then((data) => {
        const reviewList = Array.isArray(data) ? data : (data?.content || []);
        setReviews(reviewList);
      })
      .catch((err) => console.error('Error fetching reviews:', err))
      .finally(() => setReviewsLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h2 className="text-lg font-bold text-slate-900">Provider Profile Not Found</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Profile Header Card */}
      <div className="bg-white rounded-lg p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-slate-900 text-white font-bold text-2xl flex items-center justify-center shrink-0">
              {provider.name?.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{provider.name}</h1>
                {provider.verificationStatus === 'VERIFIED' && (
                  <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-medium px-2 py-0.5 rounded border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {provider.serviceArea} ({provider.serviceRadiusKm} km coverage)
              </p>
            </div>
          </div>

          <div className="text-right w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100">
            <div>
              <span className="text-xs text-slate-500 block font-medium">Starting Price</span>
              <span className="text-xl font-bold text-slate-900">₹{provider.startingPrice}</span>
            </div>
            <button
              onClick={() => navigate(`/book/${provider.id}`)}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors text-xs"
            >
              Book Service <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
          <div>
            <div className="text-xs font-medium text-slate-500">Rating</div>
            <div className="text-base font-semibold text-slate-900 mt-0.5 flex items-center justify-center gap-1">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              {provider.rating > 0 ? provider.rating.toFixed(1) : 'New'}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Completed Jobs</div>
            <div className="text-base font-semibold text-slate-900 mt-0.5">{provider.completedJobs}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Experience</div>
            <div className="text-base font-semibold text-slate-900 mt-0.5">{provider.experienceYears} Years</div>
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">About Provider</h3>
          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
            {provider.description}
          </p>
        </div>

        {/* Services Offered */}
        <div>
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Services Offered</h3>
          <div className="flex flex-wrap gap-2">
            {provider.services?.map((s) => (
              <span key={s.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-800 font-medium text-xs rounded-lg border border-slate-200">
                <Wrench className="w-3.5 h-3.5 text-slate-500" /> {s.name} ({s.defaultDurationMins}m)
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="bg-white rounded-lg p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Customer Reviews</h2>
            <p className="text-xs text-slate-500 mt-0.5">Verified feedback from completed bookings</p>
          </div>
          {reviews.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-slate-900 font-semibold text-xs">{provider.rating > 0 ? provider.rating.toFixed(1) : 'New'}</span>
              <span className="text-slate-500 text-xs">({reviews.length})</span>
            </div>
          )}
        </div>

        {reviewsLoading ? (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900 mx-auto"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-lg border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-2">
              <Star className="w-5 h-5 text-slate-400" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800">No reviews yet</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Reviews appear here once service jobs are completed.
            </p>
          </div>
        ) : (
          <div className="space-y-4 divide-y divide-slate-100">
            {reviews.map((rev) => (
              <div key={rev.id} className="pt-4 first:pt-0 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center border border-slate-200">
                      {rev.customerName ? rev.customerName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900">{rev.customerName || 'Customer'}</h4>
                      <p className="text-[10px] text-slate-400">
                        {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
                      </p>
                    </div>
                  </div>
                  <RatingStars rating={rev.rating} />
                </div>
                {rev.comment && (
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                    "{rev.comment}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
