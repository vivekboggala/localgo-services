import React, { useState } from 'react';
import { MapPin, Navigation, ChevronDown, AlertCircle } from 'lucide-react';
import { Badge, Button } from '../ui';
import { LocationSheet } from './LocationSheet';

export const LocationSelector = ({
  location,
  error,
  loading,
  usingGPS,
  onRequestGPS,
  onSelectManual,
  predefinedLocations = [],
}) => {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <div className="bg-brand-white rounded-card p-4 border border-gray-200 shadow-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-3 text-left min-w-0 group cursor-pointer"
        >
          <div className="w-11 h-11 rounded-card bg-brand-yellowSoft border border-brand-yellow text-brand-ink flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                Service Location
              </span>
              {usingGPS && (
                <Badge tone="success" dot className="py-0.5 px-2 text-[10px]">
                  GPS
                </Badge>
              )}
            </div>
            <div className="font-display font-bold text-ds-16 text-brand-ink flex items-center gap-1.5 truncate">
              <span className="truncate">
                {location?.city || `${location?.lat?.toFixed(3)}, ${location?.lng?.toFixed(3)}`}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-600 shrink-0 group-hover:translate-y-0.5 transition-transform" />
            </div>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            loading={loading}
            onClick={onRequestGPS}
            leftIcon={<Navigation className="w-4 h-4" strokeWidth={2} />}
            className="flex-1 sm:flex-none"
          >
            {loading ? 'Locating...' : 'Use GPS'}
          </Button>
          <Button
            variant="primary"
            onClick={() => setSheetOpen(true)}
            className="flex-1 sm:flex-none"
          >
            Change City
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-2 p-3 rounded-card bg-amber-50 border border-amber-200 text-ds-12 text-amber-900 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-status-warning shrink-0" strokeWidth={2} />
            {error === 'PERMISSION_DENIED'
              ? 'GPS disabled. Tap Change City to pick your service zone.'
              : 'Could not detect GPS location. Select a city manually.'}
          </span>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="font-bold underline text-brand-ink shrink-0"
          >
            Select City
          </button>
        </div>
      )}

      <LocationSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        location={location}
        error={error}
        loading={loading}
        usingGPS={usingGPS}
        onRequestGPS={onRequestGPS}
        onSelectManual={onSelectManual}
        predefinedLocations={predefinedLocations}
      />
    </>
  );
};

export default LocationSelector;
