import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  SlidersHorizontal,
  Search,
  List,
  Map as MapIcon,
  RotateCcw,
  Star,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import { useLocation } from '../../hooks/useLocation';
import { useLiveSync } from '../../hooks/useLiveSync';
import { providerService } from '../../services/providerService';
import { serviceService } from '../../services/serviceService';
import { LocationSelector } from '../../components/customer/LocationSelector';
import { ProviderCard } from '../../components/customer/ProviderCard';
import { ProviderMap } from '../../components/map/ProviderMap';
import {
  Avatar,
  BottomSheet,
  Button,
  Chip,
  EmptyState,
  ErrorState,
  PageHeader,
  Select,
  SkeletonCard,
  Toggle,
} from '../../components/ui';
import { formatCurrency, getProviderAvatar } from '../../utils/helpers';

export const NearbyProvidersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialServiceId = searchParams.get('serviceId') || '';
  const navigate = useNavigate();

  const {
    location,
    error: locError,
    loading: locLoading,
    usingGPS,
    requestGPSLocation,
    selectManualLocation,
    predefinedLocations,
  } = useLocation();

  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState(initialServiceId);
  const [radius, setRadius] = useState(15);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  // Filter & Sort States
  const [sortBy, setSortBy] = useState('distance');
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(2000);
  const [availableOnly, setAvailableOnly] = useState(false);

  // Mobile View & Filter Sheet States
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map' (< lg)
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);
  const [selectedMapProvider, setSelectedMapProvider] = useState(null);

  useEffect(() => {
    setServiceId(searchParams.get('serviceId') || '');
  }, [searchParams]);

  useEffect(() => {
    serviceService.getAllServices()
      .then((data) => setServices(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const fetchProviders = useCallback(({ silent = false } = {}) => {
    if (!location?.lat || !location?.lng) return;
    if (!silent) {
      setLoading(true);
      setApiError('');
    }
    providerService.getNearbyProviders(
      location.lat,
      location.lng,
      radius,
      serviceId || null,
      minRating > 0 ? minRating : null,
      maxPrice < 2000 ? maxPrice : null,
      availableOnly ? true : null,
      sortBy,
      silent ? { skipMockFallback: true } : {}
    )
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setProviders(list);
        if (list.length > 0) {
          setSelectedMapProvider((prev) =>
            prev ? list.find((p) => p.id === prev.id) || list[0] : list[0]
          );
        } else {
          setSelectedMapProvider(null);
        }
      })
      .catch((err) => {
        if (!silent) {
          setProviders([]);
          setApiError(err.response?.data?.message || 'Unable to load nearby providers.');
        }
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }, [location?.lat, location?.lng, radius, serviceId, minRating, maxPrice, availableOnly, sortBy]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  useLiveSync(() => fetchProviders({ silent: true }), {
    enabled: Boolean(location?.lat && location?.lng),
    watchProviders: true,
  });

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (serviceId) count += 1;
    if (minRating > 0) count += 1;
    if (maxPrice < 2000) count += 1;
    if (availableOnly) count += 1;
    if (radius !== 15) count += 1;
    return count;
  }, [serviceId, minRating, maxPrice, availableOnly, radius]);

  const handleResetFilters = () => {
    setServiceId('');
    setMinRating(0);
    setMaxPrice(2000);
    setAvailableOnly(false);
    setSortBy('distance');
    setRadius(15);
    if (searchParams.get('serviceId')) {
      searchParams.delete('serviceId');
      setSearchParams(searchParams);
    }
  };

  const renderFilterControls = () => (
    <div className="space-y-5">
      <Select
        label="Service Category"
        value={serviceId}
        onChange={(e) => setServiceId(e.target.value)}
        options={[
          { value: '', label: 'All Services' },
          ...services.map((s) => ({ value: s.id, label: s.name })),
        ]}
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between text-ds-12 font-semibold text-gray-900">
          <span>Minimum Rating</span>
          <span className="font-display font-bold text-ds-14 text-brand-ink">
            {minRating > 0 ? `${minRating.toFixed(1)}+ ★` : 'Any rating'}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="5"
          step="0.5"
          value={minRating}
          onChange={(e) => setMinRating(Number(e.target.value))}
          aria-label="Minimum rating"
          className="w-full accent-brand-ink cursor-pointer"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-ds-12 font-semibold text-gray-900">
          <span>Max Starting Price</span>
          <span className="font-display font-bold text-ds-14 text-brand-ink">
            {maxPrice >= 2000 ? 'Any price' : formatCurrency(maxPrice)}
          </span>
        </div>
        <input
          type="range"
          min="100"
          max="2000"
          step="50"
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          aria-label="Maximum starting price"
          className="w-full accent-brand-ink cursor-pointer"
        />
      </div>

      <div className="space-y-2">
        <span className="block text-ds-12 font-semibold text-gray-900">Search Radius</span>
        <div className="flex flex-wrap gap-1.5">
          {[3, 5, 10, 15, 25].map((r) => (
            <Chip
              key={r}
              selected={radius === r}
              tone="yellow"
              onClick={() => setRadius(r)}
            >
              {r} km
            </Chip>
          ))}
        </div>
      </div>

      <Select
        label="Sort By"
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        options={[
          { value: 'distance', label: 'Distance (Nearest first)' },
          { value: 'rating', label: 'Rating (Highest first)' },
          { value: 'price_asc', label: 'Price (Low to High)' },
          { value: 'price_desc', label: 'Price (High to Low)' },
        ]}
      />

      <Toggle
        checked={availableOnly}
        onChange={setAvailableOnly}
        label="Online & Available Now"
        description="Only show pros currently on duty"
      />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <PageHeader
        title="Nearby Professionals"
        subtitle={`${providers.length} verified pros within ${radius} km of ${location?.city || 'your location'}`}
        actions={
          <div className="lg:hidden inline-flex items-center bg-gray-100 p-1 rounded-pill border border-gray-200">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 min-h-[38px] px-3.5 rounded-pill text-ds-12 font-bold transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-brand-ink text-brand-white shadow-card' : 'text-gray-600'
              }`}
            >
              <List className="w-4 h-4" strokeWidth={2} /> List
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`inline-flex items-center gap-1.5 min-h-[38px] px-3.5 rounded-pill text-ds-12 font-bold transition-all cursor-pointer ${
                viewMode === 'map' ? 'bg-brand-ink text-brand-white shadow-card' : 'text-gray-600'
              }`}
            >
              <MapIcon className="w-4 h-4" strokeWidth={2} /> Map
            </button>
          </div>
        }
      />

      <LocationSelector
        location={location}
        error={locError}
        loading={locLoading}
        usingGPS={usingGPS}
        onRequestGPS={requestGPSLocation}
        onSelectManual={selectManualLocation}
        predefinedLocations={predefinedLocations}
      />

      {/* Mobile / Tablet Sticky Chip Filter Bar */}
      <div className="lg:hidden sticky top-16 z-30 -mx-4 px-4 sm:mx-0 sm:px-0 py-2.5 bg-brand-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Chip
            selected={availableOnly}
            tone="yellow"
            onClick={() => setAvailableOnly((p) => !p)}
          >
            Online now
          </Chip>

          <Chip
            selected={minRating >= 4}
            tone="yellow"
            onClick={() => setMinRating((p) => (p >= 4 ? 0 : 4))}
          >
            Rating 4+
          </Chip>

          <Chip
            selected={sortBy === 'price_asc'}
            tone="yellow"
            onClick={() => setSortBy((p) => (p === 'price_asc' ? 'distance' : 'price_asc'))}
          >
            Price low-high
          </Chip>

          <Chip
            selected={activeFilterCount > 0}
            tone="ink"
            leftIcon={<SlidersHorizontal className="w-4 h-4" strokeWidth={2} />}
            count={activeFilterCount > 0 ? activeFilterCount : null}
            onClick={() => setFiltersSheetOpen(true)}
          >
            All Filters
          </Chip>
        </div>
      </div>

      {/* DESKTOP 3-PANE / TWO-PANE WEBSITE LAYOUT (lg+) + RESPONSIVE TABLET/MOBILE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sticky Sidebar (3 Cols on Desktop) */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-24 bg-brand-white border border-gray-200 rounded-card p-5 shadow-card space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="font-display font-bold text-ds-16 text-brand-ink inline-flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </h2>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-ds-12 font-bold text-gray-600 hover:text-brand-ink inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            )}
          </div>

          {renderFilterControls()}
        </aside>

        {/* Center List Pane (5 Cols on Desktop, Full on Mobile when viewMode==='list') */}
        <div className={`${viewMode === 'map' ? 'hidden lg:block' : 'block'} lg:col-span-5 space-y-4`}>
          {apiError ? (
            <ErrorState message={apiError} onRetry={() => fetchProviders()} />
          ) : loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : providers.length === 0 ? (
            <EmptyState
              icon={<Search className="w-7 h-7" strokeWidth={2} />}
              title="No providers match these filters"
              description="Try turning off some filters, raising your max price, or expanding your search radius."
              actionLabel="Reset Filters"
              actionVariant="accent"
              onAction={handleResetFilters}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
              {providers.map((p) => {
                const isHighlighted = selectedMapProvider?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onMouseEnter={() => setSelectedMapProvider(p)}
                    onFocus={() => setSelectedMapProvider(p)}
                    className={`rounded-card transition-all duration-150 ${
                      isHighlighted ? 'lg:ring-2 lg:ring-brand-yellow' : ''
                    }`}
                  >
                    <ProviderCard provider={p} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Sticky Map Pane (4 Cols on Desktop, or Full View when viewMode==='map' on Mobile) */}
        <div
          className={`${
            viewMode === 'map' ? 'block' : 'hidden lg:block'
          } lg:col-span-4 lg:sticky lg:top-24`}
        >
          <div className="relative h-[540px] lg:h-[calc(100vh-128px)] lg:min-h-[540px] rounded-sheet overflow-hidden border border-gray-200 shadow-card">
            <ProviderMap
              customerLocation={location}
              providers={providers}
              selectedProvider={selectedMapProvider}
              onSelectProvider={(p) => setSelectedMapProvider(p)}
            />

            {selectedMapProvider && (
              <div className="absolute bottom-4 left-4 right-4 z-20 bg-brand-white rounded-sheet p-4 border border-gray-200 shadow-sheet flex items-center justify-between gap-3 animate-sheet-up">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    src={getProviderAvatar(selectedMapProvider.name)}
                    name={selectedMapProvider.name}
                    size="md"
                    status={selectedMapProvider.available ? 'online' : 'offline'}
                    verified={selectedMapProvider.verificationStatus === 'VERIFIED'}
                  />
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-ds-14 text-brand-ink truncate">
                      {selectedMapProvider.name}
                    </h3>
                    <div className="text-ds-12 text-gray-600 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 font-semibold text-brand-ink">
                        <Star className="w-3.5 h-3.5 fill-brand-yellow text-brand-yellow" />
                        {selectedMapProvider.rating > 0 ? Number(selectedMapProvider.rating).toFixed(1) : 'New'}
                      </span>
                      <span className="inline-flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" /> {selectedMapProvider.distanceKm ?? '—'} km
                      </span>
                      <span className="font-bold text-brand-ink">
                        {formatCurrency(selectedMapProvider.startingPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  variant={selectedMapProvider.available ? 'accent' : 'secondary'}
                  onClick={() =>
                    navigate(
                      selectedMapProvider.available
                        ? `/book/${selectedMapProvider.id}`
                        : `/providers/${selectedMapProvider.id}`
                    )
                  }
                  rightIcon={<ArrowRight className="w-4 h-4" strokeWidth={2.2} />}
                  className="shrink-0"
                >
                  {selectedMapProvider.available ? 'Book' : 'View'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters Sheet (Mobile/Tablet) */}
      <BottomSheet
        open={filtersSheetOpen}
        onClose={() => setFiltersSheetOpen(false)}
        title="Filter & Sort Professionals"
        subtitle="Customize service type, budget, and distance radius"
        desktopPresentation="drawer"
        footer={
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              fullWidth
              leftIcon={<RotateCcw className="w-4 h-4" strokeWidth={2} />}
              onClick={handleResetFilters}
            >
              Reset
            </Button>
            <Button
              variant="accent"
              fullWidth
              onClick={() => setFiltersSheetOpen(false)}
            >
              Show {providers.length} Pros
            </Button>
          </div>
        }
      >
        {renderFilterControls()}
      </BottomSheet>
    </div>
  );
};
