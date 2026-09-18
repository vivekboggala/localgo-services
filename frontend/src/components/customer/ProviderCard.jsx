import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ShieldCheck, Heart } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { favoriteService } from '../../services/favoriteService';
import { getProviderAvatar } from '../../utils/helpers';
import toast from 'react-hot-toast';

export const ProviderCard = ({ provider, isFavoriteInitial = false, onFavoriteToggle }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(isFavoriteInitial);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    if (user && user.role === 'CUSTOMER' && provider?.id) {
      favoriteService.checkIsFavorite(provider.id)
        .then((fav) => setIsFavorite(fav))
        .catch(() => {});
    }
  }, [user, provider?.id]);

  const handleToggleFavorite = async (e) => {
    e.stopPropagation();
    if (!user || user.role !== 'CUSTOMER') {
      toast.error('Please log in as a customer to favorite providers');
      return;
    }
    setFavLoading(true);
    try {
      if (isFavorite) {
        await favoriteService.removeFavorite(provider.id);
        setIsFavorite(false);
        toast.success(`Removed ${provider.name} from favorites`);
      } else {
        await favoriteService.addFavorite(provider.id);
        setIsFavorite(true);
        toast.success(`Added ${provider.name} to favorites ❤️`);
      }
      if (onFavoriteToggle) onFavoriteToggle(provider.id, !isFavorite);
    } catch (err) {
      toast.error('Failed to update favorite status');
    } finally {
      setFavLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-card hover:shadow-card-hover hover:border-slate-300 transition-all duration-200 flex flex-col justify-between relative group">
      <div>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <img
              src={getProviderAvatar(provider.name)}
              alt={provider.name}
              className="w-10 h-10 rounded-md bg-slate-100 object-cover border border-slate-200 shrink-0"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="w-10 h-10 rounded-md bg-slate-900 text-white font-bold text-sm items-center justify-center shrink-0 hidden">
              {provider.name?.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-slate-900 text-sm tracking-tight">{provider.name}</h3>
                {provider.verificationStatus === 'VERIFIED' && (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" title="Verified Professional" />
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {provider.services?.[0]?.name || 'Service Professional'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user?.role === 'CUSTOMER' && (
              <button
                type="button"
                onClick={handleToggleFavorite}
                disabled={favLoading}
                className="p-1.5 rounded-md hover:bg-slate-100 transition-colors text-slate-400 hover:text-rose-500"
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart className={`w-4 h-4 transition-colors ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            )}

            <span className={`px-2 py-0.5 rounded-sm text-[11px] font-semibold border ${
              provider.available ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}>
              {provider.available ? 'Available' : 'Offline'}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed font-normal">
          {provider.description}
        </p>

        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 mb-4 text-center text-xs">
          <div>
            <div className="text-[10px] font-medium text-slate-500 uppercase">Rating</div>
            <div className="font-semibold text-slate-900 flex items-center justify-center gap-1 mt-0.5">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {provider.rating > 0 ? provider.rating.toFixed(1) : 'New'}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-medium text-slate-500 uppercase">Jobs</div>
            <div className="font-semibold text-slate-900 mt-0.5">{provider.completedJobs}</div>
          </div>
          <div>
            <div className="text-[10px] font-medium text-slate-500 uppercase">Distance</div>
            <div className="font-semibold text-slate-900 mt-0.5">
              {provider.distanceKm != null ? `${provider.distanceKm} km` : provider.serviceArea}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div>
          <span className="text-[10px] text-slate-400 block font-medium uppercase">Starting Rate</span>
          <span className="text-sm font-bold text-slate-900">₹{provider.startingPrice}</span>
        </div>
        <button
          onClick={() => navigate(`/providers/${provider.id}`)}
          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-md text-xs transition-all duration-200 shadow-sm hover:shadow hover:-translate-y-0.5 active:translate-y-0"
        >
          View Profile
        </button>
      </div>
    </div>
  );
};
