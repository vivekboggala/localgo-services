import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../../hooks/useLocation';
import { providerService } from '../../services/providerService';
import { ProviderMap } from '../../components/map/ProviderMap';
import { ProviderCard } from '../../components/customer/ProviderCard';

export const MapPage = () => {
  const { location, requestGPSLocation, selectManualLocation, predefinedLocations } = useLocation();
  const [providers, setProviders] = useState([]);
  const [radius, setRadius] = useState(10);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (location?.lat && location?.lng) {
      providerService.getNearbyProviders(location.lat, location.lng, radius)
        .then((data) => setProviders(data))
        .catch(() => setProviders([]));
    }
  }, [location, radius]);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row overflow-hidden bg-gray-50">
      {/* LEFT: Provider List Sidebar on Desktop */}
      <div className="w-full md:w-96 lg:w-[420px] bg-white border-r border-gray-200 flex flex-col h-1/2 md:h-full z-10 shadow-lg">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="font-extrabold text-gray-900 text-lg">Nearby Providers</h2>
            <p className="text-xs text-gray-400">{providers.length} active professionals found</p>
          </div>
          <select
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
          >
            <option value={3}>3 km</option>
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={15}>15 km</option>
          </select>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {providers.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedProvider(p)}
              className={`cursor-pointer transition-all ${selectedProvider?.id === p.id ? 'ring-2 ring-primary-500 rounded-2xl' : ''}`}
            >
              <ProviderCard provider={p} />
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: Full Interactive Leaflet Map */}
      <div className="flex-1 h-1/2 md:h-full relative">
        <ProviderMap
          customerLocation={location}
          providers={providers}
          selectedProvider={selectedProvider}
          onSelectProvider={(p) => {
            setSelectedProvider(p);
            navigate(`/providers/${p.id}`);
          }}
        />
      </div>
    </div>
  );
};
