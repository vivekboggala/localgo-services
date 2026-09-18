import React from 'react';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';

export const LocationSelector = ({ location, error, loading, usingGPS, onRequestGPS, onSelectManual, predefinedLocations }) => {
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-card mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200/80 shrink-0">
            <MapPin className="w-4 h-4 text-slate-700" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Search Location</div>
            <div className="text-xs font-semibold text-slate-900 flex items-center gap-2 mt-0.5">
              {location.city || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
              {usingGPS && <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-sm font-semibold">GPS Active</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onRequestGPS}
            disabled={loading}
            className="flex-1 sm:flex-none px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md transition-colors border border-slate-200/80 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Navigation className="w-3.5 h-3.5 text-slate-600" />
            {loading ? 'Locating...' : 'Use GPS'}
          </button>

          <select
            onChange={(e) => {
              const selected = predefinedLocations.find((l) => l.name === e.target.value);
              if (selected) {
                onSelectManual({ lat: selected.lat, lng: selected.lng, city: selected.name });
              }
            }}
            value={usingGPS ? '' : location.city}
            className="flex-1 sm:flex-none px-3.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-semibold text-slate-700 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900/10 shadow-xs"
          >
            <option value="" disabled>Fallback Area</option>
            {predefinedLocations.map((loc) => (
              <option key={loc.name} value={loc.name}>{loc.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
            {error === 'PERMISSION_DENIED' ? 'Location access disabled. Please select a fallback area above.' : 'Unable to acquire GPS coordinates.'}
          </span>
          <button onClick={onRequestGPS} className="font-semibold underline text-slate-900 ml-2">Retry</button>
        </div>
      )}
    </div>
  );
};
