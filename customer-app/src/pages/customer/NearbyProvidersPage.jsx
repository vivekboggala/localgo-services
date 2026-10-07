import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLocation } from '../../hooks/useLocation';
import { providerService } from '../../services/providerService';
import { LocationSelector } from '../../components/customer/LocationSelector';
import { ProviderCard } from '../../components/customer/ProviderCard';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';

export const NearbyProvidersPage = () => {
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get('serviceId');

  const { location, error, loading: locLoading, usingGPS, requestGPSLocation, selectManualLocation, predefinedLocations } = useLocation();

  const [radius, setRadius] = useState(10);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Sort States
  const [sortBy, setSortBy] = useState('distance');
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(2000);
  const [availableOnly, setAvailableOnly] = useState(true);

  useEffect(() => {
    if (location?.lat && location?.lng) {
      setLoading(true);
      providerService.getNearbyProviders(
        location.lat,
        location.lng,
        radius,
        serviceId,
        minRating > 0 ? minRating : null,
        maxPrice < 2000 ? maxPrice : null,
        availableOnly ? 'true' : 'all',
        sortBy
      )
        .then((data) => setProviders(data))
        .catch(() => setProviders([]))
        .finally(() => setLoading(false));
    }
  }, [location, radius, serviceId, minRating, maxPrice, availableOnly, sortBy]);

  const processedProviders = providers;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-display">Nearby Service Providers</h1>
          <p className="text-xs text-slate-500 mt-1">Location-verified professionals near you</p>
        </div>

        {/* Radius Filter */}
        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-md border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-600 mr-1">Radius:</span>
          {[3, 5, 10, 15, 25].map((r) => (
            <button
              key={r}
              onClick={() => setRadius(r)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                radius === r ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {r} km
            </button>
          ))}
        </div>
      </div>

      <LocationSelector
        location={location}
        error={error}
        loading={locLoading}
        usingGPS={usingGPS}
        onRequestGPS={requestGPSLocation}
        onSelectManual={selectManualLocation}
        predefinedLocations={predefinedLocations}
      />

      {/* Filter & Sort Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 uppercase text-[10px] tracking-wider">
            <SlidersHorizontal className="w-4 h-4 text-blue-600" /> Filters
          </div>

          {/* Rating filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-medium">Min Rating:</span>
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md font-semibold text-slate-900 outline-none"
            >
              <option value={0}>All Ratings</option>
              <option value={3}>3+ Stars</option>
              <option value={4}>4+ Stars</option>
              <option value={4.5}>4.5+ Stars</option>
            </select>
          </div>

          {/* Max price filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Max Price: ₹{maxPrice}</span>
            <input
              type="range"
              min="100"
              max="2000"
              step="50"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-24 accent-slate-900 cursor-pointer"
            />
          </div>

          {/* Availability toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-semibold">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="rounded text-slate-900 focus:ring-slate-900"
            />
            Available Only
          </label>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
          <span className="text-slate-500 font-medium">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 text-white font-semibold rounded-md outline-none text-xs shadow-xs cursor-pointer"
          >
            <option value="distance">Distance (Nearest)</option>
            <option value="rating">Rating (Highest)</option>
            <option value="price_asc">Price (Low to High)</option>
            <option value="price_desc">Price (High to Low)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton count={6} />
      ) : processedProviders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200/80 shadow-card">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-900 text-base mb-1">No providers found matching filters</h3>
          <p className="text-xs text-slate-500">Try adjusting your rating threshold, max price slider, or expanding search radius.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedProviders.map((p) => (
            <ProviderCard key={p.id} provider={p} />
          ))}
        </div>
      )}
    </div>
  );
};

