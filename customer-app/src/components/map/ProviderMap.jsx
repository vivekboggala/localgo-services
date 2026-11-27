import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TILE_URL, TILE_ATTRIBUTION } from '../../utils/constants';
import { getProviderAvatar, formatCurrency } from '../../utils/helpers';

const userPulseIcon = L.divIcon({
  className: 'localgo-user-pulse',
  html: `
    <div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
      <span style="position:absolute;inset:0;border-radius:9999px;background:rgba(255,199,0,0.45);animation:ping 1.8s cubic-bezier(0,0,0.2,1) infinite;"></span>
      <span style="position:relative;width:16px;height:16px;border-radius:9999px;background:#0B0B0F;border:3px solid #FFC700;box-shadow:0 2px 8px rgba(11,11,15,0.4);"></span>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const createAvatarMarkerIcon = (provider, isSelected) => {
  const ringColor = provider.available ? '#12B76A' : '#9A9AA5';
  const outerHalo = isSelected ? '0 0 0 4px #FFC700, 0 8px 18px rgba(11,11,15,0.35)' : '0 4px 12px rgba(11,11,15,0.25)';
  const size = isSelected ? 48 : 40;
  const avatarUrl = provider.avatarUrl || getProviderAvatar(provider.name);

  return L.divIcon({
    className: 'localgo-provider-pin',
    html: `
      <div style="width:${size}px;height:${size}px;border-radius:9999px;border:3px solid ${ringColor};background:#FFFFFF;overflow:hidden;box-shadow:${outerHalo};display:flex;align-items:center;justify-content:center;transition:all 150ms ease;">
        <img src="${avatarUrl}" alt="" style="width:100%;height:100%;object-fit:cover;" />
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const MapController = ({ center, recenterKey, onViewportChange }) => {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    if (!container || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  useEffect(() => {
    if (center?.lat && center?.lng) {
      map.setView([center.lat, center.lng], map.getZoom(), { animate: true });
    }
  }, [center?.lat, center?.lng, recenterKey, map]);

  useMapEvents({
    moveend: () => {
      if (onViewportChange) {
        const c = map.getCenter();
        onViewportChange({ lat: c.lat, lng: c.lng });
      }
    },
  });

  return null;
};

export const ProviderMap = ({
  customerLocation,
  providers = [],
  selectedProvider = null,
  onSelectProvider = null,
  recenterKey = 0,
  onViewportChange = null,
  showPopups = false,
  radiusKm = null,
  className = '',
}) => {
  const focusProvider = selectedProvider || (providers.length === 1 ? providers[0] : null);

  const center = useMemo(() => {
    if (customerLocation?.lat && customerLocation?.lng) {
      return { lat: customerLocation.lat, lng: customerLocation.lng };
    }
    if (focusProvider?.latitude != null && focusProvider?.longitude != null) {
      return { lat: focusProvider.latitude, lng: focusProvider.longitude };
    }
    return { lat: 12.9716, lng: 77.5946 };
  }, [customerLocation?.lat, customerLocation?.lng, focusProvider?.latitude, focusProvider?.longitude]);

  return (
    <div className={`w-full h-full min-h-[260px] overflow-hidden relative z-0 ${className}`}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
        zoomControl={false}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <ZoomControl position="topright" />
        <MapController
          center={center}
          recenterKey={recenterKey}
          onViewportChange={onViewportChange}
        />

        {customerLocation?.lat && customerLocation?.lng && (
          <Marker position={[customerLocation.lat, customerLocation.lng]} icon={userPulseIcon}>
            <Popup>
              <div className="p-1 font-display font-bold text-xs text-brand-ink">
                Your Location
              </div>
            </Popup>
          </Marker>
        )}

        {radiusKm != null && focusProvider?.latitude != null && focusProvider?.longitude != null && (
          <Circle
            center={[focusProvider.latitude, focusProvider.longitude]}
            radius={Number(radiusKm) * 1000}
            pathOptions={{
              color: '#FFC700',
              fillColor: '#FFC700',
              fillOpacity: 0.12,
              weight: 2,
            }}
          />
        )}

        {providers
          .filter((p) => p.latitude != null && p.longitude != null)
          .map((p) => {
            const isSelected = selectedProvider?.id === p.id;
            return (
              <Marker
                key={p.id}
                position={[p.latitude, p.longitude]}
                icon={createAvatarMarkerIcon(p, isSelected)}
                eventHandlers={{
                  click: () => onSelectProvider?.(p),
                }}
              >
                {showPopups && (
                  <Popup>
                    <div className="p-1.5 min-w-[170px] space-y-1.5">
                      <div className="font-bold text-xs text-brand-ink">{p.name}</div>
                      <div className="text-[11px] text-gray-600">
                        {p.rating > 0 ? `${Number(p.rating).toFixed(1)} ★` : 'New'} &bull; {formatCurrency(p.startingPrice)}
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelectProvider?.(p)}
                        className="w-full py-1.5 px-2.5 bg-brand-ink text-brand-white font-semibold text-xs rounded-lg"
                      >
                        View Pro
                      </button>
                    </div>
                  </Popup>
                )}
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
};
