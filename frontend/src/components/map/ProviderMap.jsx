import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TILE_URL, TILE_ATTRIBUTION } from '../../utils/constants';

// Custom Map Markers using clean SVG icons
const customerIcon = L.divIcon({
  className: 'custom-customer-icon',
  html: `<div style="background-color: #0f172a; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(15,23,42,0.3);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const providerAvailableIcon = L.divIcon({
  className: 'custom-provider-icon',
  html: `<div style="background-color: #0f172a; color: white; width: 32px; height: 32px; border-radius: 8px; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.2);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const providerBusyIcon = L.divIcon({
  className: 'custom-provider-icon',
  html: `<div style="background-color: #64748b; color: white; width: 28px; height: 28px; border-radius: 6px; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.15);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const MapRecenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom());
  }, [center, map]);
  return null;
};

export const ProviderMap = ({ customerLocation, providers = [], selectedProvider, onSelectProvider }) => {
  const center = customerLocation ? { lat: customerLocation.lat, lng: customerLocation.lng } : { lat: 13.5500, lng: 78.5000 };

  return (
    <div className="w-full h-full min-h-[400px] rounded-lg overflow-hidden shadow-sm border border-slate-200 relative z-0">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <MapRecenter center={center} />

        {/* Customer Location Marker */}
        {customerLocation && (
          <Marker position={[customerLocation.lat, customerLocation.lng]} icon={customerIcon}>
            <Popup>
              <div className="p-1 font-semibold text-xs text-slate-900">Your Location</div>
            </Popup>
          </Marker>
        )}

        {/* Provider Markers */}
        {providers.map((p) => (
          <Marker
            key={p.id}
            position={[p.latitude, p.longitude]}
            icon={p.available ? providerAvailableIcon : providerBusyIcon}
            eventHandlers={{
              click: () => onSelectProvider && onSelectProvider(p),
            }}
          >
            <Popup>
              <div className="p-2 min-w-[180px]">
                <div className="font-semibold text-sm text-slate-900 mb-0.5">{p.name}</div>
                <div className="text-xs text-slate-500 mb-2">Rating: {p.rating?.toFixed(1)} • {p.distanceKm} km away</div>
                <button
                  onClick={() => onSelectProvider && onSelectProvider(p)}
                  className="w-full py-1.5 bg-slate-900 text-white font-medium text-xs rounded-lg hover:bg-slate-800 transition-colors"
                >
                  View Provider
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
