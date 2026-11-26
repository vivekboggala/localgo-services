import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TILE_URL, TILE_ATTRIBUTION } from '../../utils/constants';

const basePinIcon = L.divIcon({
  className: 'localgo-partner-pin',
  html: `
    <div style="position:relative;width:30px;height:30px;display:flex;align-items:center;justify-content:center;">
      <span style="position:absolute;inset:0;border-radius:9999px;background:rgba(255,199,0,0.45);animation:ping 1.8s cubic-bezier(0,0,0.2,1) infinite;"></span>
      <span style="position:relative;width:18px;height:18px;border-radius:9999px;background:#FFC700;border:3px solid #0B0B0F;box-shadow:0 2px 10px rgba(0,0,0,0.45);"></span>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const MapUpdater = ({ center, onPickLocation }) => {
  const map = useMap();

  useEffect(() => {
    if (center?.lat && center?.lng) {
      map.setView([center.lat, center.lng], map.getZoom(), { animate: true });
    }
  }, [center?.lat, center?.lng, map]);

  useMapEvents({
    click: (e) => {
      if (onPickLocation) {
        onPickLocation({
          lat: Number(e.latlng.lat.toFixed(6)),
          lng: Number(e.latlng.lng.toFixed(6)),
        });
      }
    },
  });

  return null;
};

export const ProviderMap = ({
  center = { lat: 12.9716, lng: 77.5946 },
  radiusKm = null,
  interactive = false,
  onPickLocation = null,
  zoom = 12,
  className = '',
}) => {
  const safeCenter = useMemo(
    () => ({
      lat: Number(center?.lat) || 12.9716,
      lng: Number(center?.lng) || 77.5946,
    }),
    [center?.lat, center?.lng]
  );

  return (
    <div className={`w-full h-full min-h-[220px] rounded-card overflow-hidden border border-gray-200 dark:border-gray-600/35 relative z-0 ${className}`}>
      <MapContainer
        center={[safeCenter.lat, safeCenter.lng]}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={interactive}
        zoomControl={false}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <MapUpdater center={safeCenter} onPickLocation={interactive ? onPickLocation : null} />

        <Marker
          position={[safeCenter.lat, safeCenter.lng]}
          icon={basePinIcon}
          draggable={interactive}
          eventHandlers={
            interactive
              ? {
                  dragend: (e) => {
                    const pos = e.target.getLatLng();
                    onPickLocation?.({
                      lat: Number(pos.lat.toFixed(6)),
                      lng: Number(pos.lng.toFixed(6)),
                    });
                  },
                }
              : {}
          }
        >
          <Popup>
            <div className="p-1 font-display font-bold text-xs text-brand-ink">
              Service Base Pin
            </div>
          </Popup>
        </Marker>

        {radiusKm && Number(radiusKm) > 0 && (
          <Circle
            center={[safeCenter.lat, safeCenter.lng]}
            radius={Number(radiusKm) * 1000}
            pathOptions={{
              color: '#FFC700',
              fillColor: '#FFC700',
              fillOpacity: 0.16,
              weight: 2,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};
