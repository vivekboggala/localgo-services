import React, { useState } from 'react';
import { MapPin, Navigation, CheckCircle2, Search, AlertCircle } from 'lucide-react';
import { BottomSheet, Button, Input } from '../ui';

export const LocationSheet = ({
  open,
  onClose,
  location,
  error,
  loading,
  usingGPS,
  onRequestGPS,
  onSelectManual,
  predefinedLocations = [],
}) => {
  const [cityQuery, setCityQuery] = useState('');

  const filteredCities = predefinedLocations.filter((loc) =>
    loc.name.toLowerCase().includes(cityQuery.trim().toLowerCase())
  );

  const handleSelectCity = (loc) => {
    onSelectManual?.({ lat: loc.lat, lng: loc.lng, city: loc.name });
    onClose?.();
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Select your service area"
      subtitle="Choose GPS or a supported city to discover nearby verified pros"
    >
      <div className="space-y-4">
        <Button
          variant="accent"
          fullWidth
          loading={loading}
          leftIcon={<Navigation className="w-5 h-5" strokeWidth={2} />}
          onClick={() => {
            onRequestGPS?.();
          }}
        >
          {loading ? 'Detecting Current Location...' : 'Use Current Location (GPS)'}
        </Button>

        {usingGPS && !loading && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-card bg-emerald-50 border border-emerald-200 text-emerald-800 text-ds-12 font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2} />
            <span>GPS active: {location?.city || 'Current location'}</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-card bg-amber-50 border border-amber-200 text-amber-900 text-ds-12 font-medium flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-status-warning" strokeWidth={2} />
            <span>
              {error === 'PERMISSION_DENIED'
                ? 'Location permission is blocked in your browser. Choose a city below.'
                : 'Unable to detect GPS coordinates right now. Pick a city below.'}
            </span>
          </div>
        )}

        <div className="pt-1 space-y-3">
          <Input
            value={cityQuery}
            onChange={(e) => setCityQuery(e.target.value)}
            placeholder="Search city or neighborhood..."
            leftIcon={<Search className="w-4 h-4" strokeWidth={2} />}
            aria-label="Filter cities"
          />

          <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
            {filteredCities.length === 0 ? (
              <p className="text-ds-12 text-gray-600 text-center py-6">
                No matching service zones found.
              </p>
            ) : (
              filteredCities.map((loc) => {
                const isSelected = !usingGPS && location?.city === loc.name;
                return (
                  <button
                    key={loc.name}
                    type="button"
                    onClick={() => handleSelectCity(loc)}
                    className={`w-full min-h-[52px] px-4 py-3 rounded-card border flex items-center justify-between gap-3 text-left transition-all duration-150 ${
                      isSelected
                        ? 'bg-brand-yellowSoft border-brand-yellow text-brand-ink shadow-card'
                        : 'bg-brand-white border-gray-200 text-brand-ink hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-9 h-9 rounded-card flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-brand-ink text-brand-yellow' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <MapPin className="w-4 h-4" strokeWidth={2} />
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-ds-14 text-brand-ink truncate">{loc.name}</div>
                        <div className="text-ds-12 text-gray-600">Available zone • 15 km radius</div>
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-brand-ink shrink-0" strokeWidth={2.5} />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};

export default LocationSheet;
