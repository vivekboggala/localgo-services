import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crosshair,
  Search,
  Star,
  MapPin,
  Briefcase,
  ShieldCheck,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useLocation } from '../../hooks/useLocation';
import { useLiveSync } from '../../hooks/useLiveSync';
import { providerService } from '../../services/providerService';
import { ProviderMap } from '../../components/map/ProviderMap';
import { Avatar, Badge, Button, Skeleton } from '../../components/ui';
import { formatCurrency, getProviderAvatar } from '../../utils/helpers';

export const MapPage = () => {
  const { location, requestGPSLocation } = useLocation();
  const [searchCenter, setSearchCenter] = useState(null);
  const [viewportCenter, setViewportCenter] = useState(null);
  const [areaDirty, setAreaDirty] = useState(false);
  const [recenterKey, setRecenterKey] = useState(0);

  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [radius] = useState(15);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [sheetExpanded, setSheetExpanded] = useState(true);
  const dragStartYRef = useRef(null);

  const navigate = useNavigate();

  const activeCoords = searchCenter || location;

  const fetchNearbyProviders = useCallback(({ silent = false } = {}) => {
    if (!activeCoords?.lat || !activeCoords?.lng) return;
    if (!silent) setLoading(true);
    providerService.getNearbyProviders(
      activeCoords.lat,
      activeCoords.lng,
      radius,
      null,
      null,
      null,
      null,
      null,
      silent ? { skipMockFallback: true } : {}
    )
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setProviders(list);
        setSelectedProvider((prev) => {
          if (prev) {
            const match = list.find((p) => p.id === prev.id);
            if (match) return match;
          }
          return list[0] || null;
        });
      })
      .catch(() => {
        if (!silent) setProviders([]);
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }, [activeCoords?.lat, activeCoords?.lng, radius]);

  useEffect(() => {
    fetchNearbyProviders();
  }, [fetchNearbyProviders]);

  useLiveSync(() => fetchNearbyProviders({ silent: true }), {
    enabled: Boolean(activeCoords?.lat && activeCoords?.lng),
    watchProviders: true,
  });

  const handleViewportChange = useCallback((coords) => {
    setViewportCenter(coords);
    if (activeCoords?.lat && activeCoords?.lng) {
      const dist = Math.abs(coords.lat - activeCoords.lat) + Math.abs(coords.lng - activeCoords.lng);
      if (dist > 0.01) {
        setAreaDirty(true);
      }
    }
  }, [activeCoords?.lat, activeCoords?.lng]);

  const handleSearchThisArea = () => {
    if (!viewportCenter) return;
    setSearchCenter(viewportCenter);
    setAreaDirty(false);
  };

  const handleRecenter = () => {
    setSearchCenter(null);
    setAreaDirty(false);
    setRecenterKey((k) => k + 1);
    requestGPSLocation();
  };

  return (
    <div className="relative w-full h-[calc(100dvh-132px)] md:h-[calc(100dvh-64px)] overflow-hidden bg-gray-100">
      {/* Full-Screen Leaflet Map */}
      <ProviderMap
        customerLocation={activeCoords}
        providers={providers}
        selectedProvider={selectedProvider}
        recenterKey={recenterKey}
        onViewportChange={handleViewportChange}
        onSelectProvider={(p) => {
          setSelectedProvider(p);
          setSheetExpanded(true);
        }}
      />

      {/* Top Floating Search This Area + Pro Count Pill */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2">
          {areaDirty ? (
            <button
              type="button"
              onClick={handleSearchThisArea}
              className="min-h-[44px] px-4 py-2 rounded-pill bg-brand-ink text-brand-yellow font-display font-bold text-ds-12 shadow-sheet border border-gray-900 inline-flex items-center gap-2 active:scale-95 transition-transform"
            >
              <Search className="w-4 h-4" strokeWidth={2.2} />
              Search this area
            </button>
          ) : (
            <div className="px-4 py-2 rounded-pill bg-brand-white/95 backdrop-blur-md border border-gray-200 shadow-sheet text-ds-12 font-bold text-brand-ink flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-status-success animate-pulse" />
              {loading ? 'Scanning area...' : `${providers.length} pros within ${radius} km`}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Stack: Floating Recenter Button + Draggable Provider Card Sheet */}
      <div className="absolute bottom-3 left-3 right-3 sm:left-6 sm:right-6 z-20 flex flex-col items-end gap-3 pointer-events-none">
        <button
          type="button"
          onClick={handleRecenter}
          aria-label="Recenter map to your location"
          className="pointer-events-auto w-12 h-12 rounded-pill bg-brand-white hover:bg-brand-yellowSoft border border-gray-200 shadow-sheet flex items-center justify-center text-brand-ink transition-all duration-150 active:scale-95"
        >
          <Crosshair className="w-5 h-5" strokeWidth={2.2} />
        </button>

        <div className="pointer-events-auto w-full sm:w-[420px] sm:self-start bg-brand-white rounded-sheet border border-gray-200 shadow-sheet overflow-hidden transition-all duration-200">
        {/* Drag Handle Header */}
        <div
          onPointerDown={(e) => {
            dragStartYRef.current = e.clientY;
          }}
          onPointerUp={(e) => {
            if (dragStartYRef.current !== null) {
              const delta = e.clientY - dragStartYRef.current;
              if (delta > 28) setSheetExpanded(false);
              if (delta < -28) setSheetExpanded(true);
            }
            dragStartYRef.current = null;
          }}
          onClick={() => setSheetExpanded((p) => !p)}
          className="relative px-4 pt-2.5 pb-2 border-b border-gray-100 flex items-center justify-between cursor-pointer select-none"
        >
          <div className="w-10 h-1.5 rounded-pill bg-gray-200 mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 pt-1">
            {selectedProvider ? 'Selected Professional' : 'Nearby Professionals'}
          </span>
          <span className="text-gray-600 pt-1">
            {sheetExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </span>
        </div>

        {loading && !selectedProvider ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-10 w-2/3" />
          </div>
        ) : !selectedProvider ? (
          <div className="p-5 text-center space-y-2">
            <p className="font-display font-bold text-ds-16 text-brand-ink">No pros found here</p>
            <p className="text-ds-12 text-gray-600">Pan the map and tap &ldquo;Search this area&rdquo; or recenter.</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  src={getProviderAvatar(selectedProvider.name)}
                  name={selectedProvider.name}
                  size="md"
                  status={selectedProvider.available ? 'online' : 'offline'}
                  verified={selectedProvider.verificationStatus === 'VERIFIED'}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-display font-bold text-ds-16 text-brand-ink truncate">
                      {selectedProvider.name}
                    </h2>
                    {selectedProvider.verificationStatus === 'VERIFIED' && (
                      <ShieldCheck className="w-4 h-4 text-status-success shrink-0" strokeWidth={2.2} />
                    )}
                  </div>
                  <p className="text-ds-12 text-gray-600 truncate">
                    {selectedProvider.services?.[0]?.name || 'Verified Specialist'}
                  </p>
                </div>
              </div>
              <Badge tone={selectedProvider.available ? 'success' : 'neutral'} dot>
                {selectedProvider.available ? 'Online' : 'Offline'}
              </Badge>
            </div>

            {sheetExpanded && (
              <>
                <div className="flex items-center justify-between text-ds-12 font-semibold bg-gray-50 rounded-card px-3 py-2 border border-gray-100">
                  <span className="inline-flex items-center gap-1 text-brand-ink">
                    <Star className="w-4 h-4 fill-brand-yellow text-brand-yellow" />
                    {selectedProvider.rating > 0 ? Number(selectedProvider.rating).toFixed(1) : 'New'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-gray-600">
                    <Briefcase className="w-3.5 h-3.5" /> {selectedProvider.completedJobs ?? 0} jobs
                  </span>
                  <span className="inline-flex items-center gap-1 text-gray-600">
                    <MapPin className="w-3.5 h-3.5" /> {selectedProvider.distanceKm ?? '—'} km
                  </span>
                  <span className="font-display font-bold text-ds-14 text-brand-ink">
                    {formatCurrency(selectedProvider.startingPrice)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => navigate(`/providers/${selectedProvider.id}`)}
                  >
                    View profile
                  </Button>
                  <Button
                    variant={selectedProvider.available ? 'accent' : 'primary'}
                    fullWidth
                    disabled={!selectedProvider.available}
                    rightIcon={<ArrowRight className="w-4 h-4" strokeWidth={2.2} />}
                    onClick={() => navigate(`/book/${selectedProvider.id}`)}
                  >
                    {selectedProvider.available ? 'Book' : 'Offline'}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
