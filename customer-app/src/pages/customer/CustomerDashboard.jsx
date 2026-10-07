import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../hooks/useLocation';
import { providerService } from '../../services/providerService';
import { serviceService } from '../../services/serviceService';
import { LocationSelector } from '../../components/customer/LocationSelector';
import { ProviderCard } from '../../components/customer/ProviderCard';
import { Search, MapPin, Map, ArrowRight } from 'lucide-react';

export const CustomerDashboard = () => {
  const { user } = useAuth();
  const { location, error, loading: locLoading, usingGPS, requestGPSLocation, selectManualLocation, predefinedLocations } = useLocation();

  const [services, setServices] = useState([]);
  const [nearbyProviders, setNearbyProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    serviceService.getAllServices()
      .then((data) => setServices(data.slice(0, 6)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (location?.lat && location?.lng) {
      setLoadingProviders(true);
      providerService.getNearbyProviders(location.lat, location.lng, 15)
        .then((data) => setNearbyProviders(data))
        .catch(() => setNearbyProviders([]))
        .finally(() => setLoadingProviders(false));
    }
  }, [location]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-panel border border-slate-800 bg-dark-grid-pattern">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase block">Customer Portal</span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl mt-0.5 tracking-tight">Welcome, {user?.name?.split(' ')[0]}</h1>
          <p className="text-xs text-slate-400 mt-1">Discover verified doorstep service professionals in your area.</p>
        </div>

        <Link
          to="/map"
          className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 font-semibold rounded-md text-xs transition-all duration-200 shadow-sm hover:shadow flex items-center gap-1.5 whitespace-nowrap"
        >
          <Map className="w-4 h-4 text-slate-900" /> Interactive Map
        </Link>
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

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && navigate(`/services?q=${encodeURIComponent(searchQuery)}`)}
          placeholder="Search required service (e.g. AC Repair, Plumber)..."
          className="w-full pl-10 pr-4 py-3 rounded-md border border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none text-xs bg-white text-slate-900 font-medium shadow-xs"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-xl text-slate-900 tracking-tight">Service Categories</h2>
          <Link to="/services" className="text-xs font-semibold text-slate-900 hover:underline flex items-center gap-1">View All <ArrowRight className="w-3.5 h-3.5" /></Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {services.map((s) => (
            <div
              key={s.id}
              onClick={() => navigate(`/providers/nearby?serviceId=${s.id}`)}
              className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-card hover:shadow-card-hover hover:border-slate-300 transition-all duration-200 cursor-pointer text-center group"
            >
              <div className="text-xs font-semibold text-slate-900 truncate">{s.name}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{s.category}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-bold text-xl text-slate-900 tracking-tight">Nearby Professionals</h2>
            <p className="text-xs text-slate-500 mt-0.5">Distance-ranked verified providers</p>
          </div>
          <Link to="/map" className="text-xs font-semibold text-slate-900 hover:underline flex items-center gap-1">Map View <ArrowRight className="w-3.5 h-3.5" /></Link>
        </div>

        {loadingProviders ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 bg-slate-200/70 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : nearbyProviders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200/80 shadow-card">
            <p className="text-xs font-medium text-slate-500">No verified providers found near this location.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {nearbyProviders.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
