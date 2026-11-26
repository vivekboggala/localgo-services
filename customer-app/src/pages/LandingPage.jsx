import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  ShieldCheck,
  KeyRound,
  Navigation,
  Star,
  ArrowRight,
  CheckCircle2,
  MousePointerClick,
  CalendarCheck,
  Smile,
  Briefcase,
  Quote,
  Calendar,
  Wrench,
  Users,
  Building2,
} from 'lucide-react';
import { serviceService } from '../services/serviceService';
import { providerService } from '../services/providerService';
import { useLocation } from '../hooks/useLocation';
import { useLiveSync } from '../hooks/useLiveSync';
import {
  Avatar,
  Badge,
  Button,
  RatingStars,
  SkeletonCard,
  ErrorState,
} from '../components/ui';
import {
  formatCurrency,
  getProviderAvatar,
  getServiceIconComponent,
  getServiceStartingPrice,
} from '../utils/helpers';
import { LocationSheet } from '../components/customer/LocationSheet';

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: MousePointerClick,
    title: 'Choose',
    description: 'Pick a service category and browse verified pros available near your location.',
  },
  {
    step: '02',
    icon: CalendarCheck,
    title: 'Book',
    description: 'Select your date, time slot, and payment option with transparent upfront pricing.',
  },
  {
    step: '03',
    icon: Smile,
    title: 'Relax',
    description: 'Track your pro live on the map and verify arrival with your 4-digit Start OTP.',
  },
];

const TRUST_PILLARS = [
  { icon: ShieldCheck, label: 'Verified pros' },
  { icon: KeyRound, label: 'OTP-secured arrival' },
  { icon: Navigation, label: 'Live tracking' },
  { icon: Star, label: 'Rated reviews' },
];

const TESTIMONIALS = [
  {
    name: 'Ananya Deshmukh',
    city: 'Bengaluru',
    service: 'AC Repair',
    quote: 'Booked an AC technician in 2 minutes. Watched him arrive on the map and shared the Start OTP right at the door.',
    rating: 5,
  },
  {
    name: 'Karthik Reddy',
    city: 'Madanapalle',
    service: 'Plumbing',
    quote: 'Clear starting price before booking, punctual arrival, and clean pipe work. Much easier than calling random numbers.',
    rating: 5,
  },
  {
    name: 'Sneha Nair',
    city: 'Hyderabad',
    service: 'Electrical',
    quote: 'The electrician resolved a tripping MCB within 25 minutes. Having verified badges and real reviews makes all the difference.',
    rating: 5,
  },
];

const DEFAULT_CATEGORY_TILES = [
  { id: 'cat-plumbing', name: 'Plumbing', category: 'Plumbing', startingPrice: 199 },
  { id: 'cat-electrical', name: 'Electrical', category: 'Electrical', startingPrice: 199 },
  { id: 'cat-ac', name: 'AC Service', category: 'AC Repair', startingPrice: 399 },
  { id: 'cat-cleaning', name: 'Home Cleaning', category: 'Cleaning', startingPrice: 499 },
  { id: 'cat-carpentry', name: 'Carpentry', category: 'Carpentry', startingPrice: 249 },
  { id: 'cat-appliance', name: 'Appliance Care', category: 'Appliance', startingPrice: 299 },
  { id: 'cat-painting', name: 'Painting', category: 'Painting', startingPrice: 699 },
  { id: 'cat-mobile', name: 'Phone Repair', category: 'Electronics', startingPrice: 299 },
  { id: 'cat-laptop', name: 'PC & Laptop', category: 'Electronics', startingPrice: 349 },
  { id: 'cat-moving', name: 'Local Moving', category: 'Moving', startingPrice: 599 },
];

export const LandingPage = () => {
  const {
    location,
    error: locError,
    loading: locLoading,
    usingGPS,
    requestGPSLocation,
    selectManualLocation,
    predefinedLocations,
  } = useLocation();

  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [services, setServices] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [providersError, setProvidersError] = useState('');

  // Floating "Book a service" hero form state
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [locationInput, setLocationInput] = useState(location?.city || '');
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [locationSheetOpen, setLocationSheetOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (location?.city) {
      setLocationInput(location.city);
    }
  }, [location?.city]);

  const loadServices = useCallback(() => {
    setLoadingServices(true);
    serviceService.getAllServices()
      .then((data) => setServices(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingServices(false));
  }, []);

  const fetchTopProviders = useCallback(({ silent = false } = {}) => {
    const lat = location?.lat || 12.9716;
    const lng = location?.lng || 77.5946;
    if (!silent) {
      setLoadingProviders(true);
      setProvidersError('');
    }
    providerService.getNearbyProviders(lat, lng, 25, null, null, null, null, 'rating', {})
      .then((data) => {
        setProviders(Array.isArray(data) ? data.slice(0, 8) : []);
      })
      .catch(() => {
        if (!silent) setProvidersError('Unable to load top-rated professionals right now.');
      })
      .finally(() => {
        if (!silent) setLoadingProviders(false);
      });
  }, [location?.lat, location?.lng]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  useEffect(() => {
    fetchTopProviders();
  }, [fetchTopProviders]);

  useLiveSync(() => fetchTopProviders({ silent: true }), { watchProviders: true });

  const handleHeroSubmit = (e) => {
    e.preventDefault();
    const trimmed = locationInput.trim();
    if (trimmed) {
      const matched = predefinedLocations.find((l) =>
        l.name.toLowerCase().includes(trimmed.toLowerCase())
      );
      if (matched) {
        selectManualLocation({ lat: matched.lat, lng: matched.lng, city: matched.name });
      }
    }

    const params = new URLSearchParams();
    if (selectedServiceId && services.some((s) => String(s.id) === String(selectedServiceId))) {
      params.set('serviceId', selectedServiceId);
    }
    if (selectedDate) {
      params.set('date', selectedDate);
    }
    const qs = params.toString();
    navigate(qs ? `/providers/nearby?${qs}` : '/providers/nearby');
  };

  const categoryTiles = services.length > 0
    ? services.slice(0, 10)
    : DEFAULT_CATEGORY_TILES;

  const statsSummary = useMemo(() => {
    const hasProviders = providers.length > 0;
    const totalJobs = providers.reduce((acc, p) => acc + Number(p.completedJobs || 0), 0);
    const rated = providers.filter((p) => Number(p.rating) > 0);
    const avgRating = rated.length > 0
      ? (rated.reduce((acc, p) => acc + Number(p.rating), 0) / rated.length).toFixed(1)
      : '4.8';

    return [
      {
        icon: Users,
        label: hasProviders ? 'Nearby Verified Pros' : 'Verified Specialists',
        value: hasProviders ? `${providers.length}+` : '22+',
        caption: hasProviders ? `Live in ${location?.city || 'your area'}` : 'Sample platform benchmark',
      },
      {
        icon: Briefcase,
        label: totalJobs > 0 ? 'Jobs in Area' : 'Completed Bookings',
        value: totalJobs > 0 ? `${totalJobs}+` : '1,200+',
        caption: totalJobs > 0 ? 'From nearby rated pros' : 'Sample marketplace figure',
      },
      {
        icon: Building2,
        label: 'Supported Cities',
        value: `${predefinedLocations.length || 7}`,
        caption: 'Active metro & town zones',
      },
      {
        icon: Star,
        label: 'Average Rating',
        value: `${avgRating} ★`,
        caption: rated.length > 0 ? 'Across nearby verified pros' : 'Sample review rating',
      },
    ];
  }, [providers, location?.city, predefinedLocations.length]);

  const providerPortalUrl = import.meta.env.VITE_PROVIDER_APP_URL || 'http://localhost:5174';

  return (
    <div className="bg-brand-white">
      {/* 1. Full-Bleed Dark Hero with Floating "Book a service" Card */}
      <section className="bg-brand-ink text-brand-white bg-dark-grid-pattern border-b border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Headline & Value Props */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-pill bg-gray-900 border border-gray-600/40 text-ds-12 font-semibold text-brand-yellow">
                <span className="w-2 h-2 rounded-full bg-brand-yellow animate-pulse" />
                On-demand doorstep pros &bull; Instant booking
              </div>

              <h1 className="font-display font-extrabold text-ds-32 sm:text-ds-40 lg:text-[52px] tracking-tight leading-[1.06] text-brand-white">
                Trusted home services,{' '}
                <span className="text-brand-yellow">at your doorstep</span>
              </h1>

              <p className="text-ds-16 text-gray-400 max-w-xl leading-relaxed">
                Compare verified plumbers, electricians, AC technicians, and home cleaners near you with upfront starting prices, live map tracking, and OTP-secured arrival.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-1 text-ds-14 text-gray-200">
                <Link
                  to="/services"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-card bg-gray-900 hover:bg-gray-600/30 border border-gray-600/40 font-semibold transition-colors"
                >
                  Explore 10 Services <ArrowRight className="w-4 h-4 text-brand-yellow" />
                </Link>
                <Link
                  to="/map"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-card border border-gray-600/40 hover:border-brand-yellow font-semibold text-gray-200 hover:text-brand-yellow transition-colors"
                >
                  <MapPin className="w-4 h-4" /> Live Provider Map
                </Link>
              </div>
            </div>

            {/* Right Floating "Book a service" Card */}
            <div className="lg:col-span-5">
              <form
                onSubmit={handleHeroSubmit}
                className="bg-brand-white text-brand-ink rounded-sheet p-6 sm:p-7 shadow-sheet border border-gray-200 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600">
                      Instant Dispatch
                    </span>
                    <h2 className="font-display font-bold text-ds-20 text-brand-ink mt-0.5">
                      Book a service
                    </h2>
                  </div>
                  <Badge tone="accent">Upfront Pricing</Badge>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="hero-service" className="block text-ds-12 font-semibold text-gray-900">
                    What do you need help with?
                  </label>
                  <div className="relative">
                    <Wrench className="w-4 h-4 text-gray-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      id="hero-service"
                      value={selectedServiceId}
                      onChange={(e) => setSelectedServiceId(e.target.value)}
                      className="w-full min-h-[48px] pl-10 pr-4 rounded-input border border-gray-200 focus:border-brand-ink focus:ring-2 focus:ring-brand-ink/10 bg-gray-50 text-ds-14 font-semibold text-brand-ink outline-none cursor-pointer"
                    >
                      <option value="">All Home Services</option>
                      {categoryTiles.map((svc) => (
                        <option key={svc.id} value={svc.id}>
                          {svc.name} (from Rs {getServiceStartingPrice(svc)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="hero-location" className="block text-ds-12 font-semibold text-gray-900">
                      Service location
                    </label>
                    <button
                      type="button"
                      onClick={() => setLocationSheetOpen(true)}
                      className="text-[11px] font-bold text-brand-ink hover:underline cursor-pointer"
                    >
                      Pick city preset
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <MapPin className="w-4 h-4 text-brand-ink absolute left-3.5 pointer-events-none" strokeWidth={2.2} />
                    <input
                      id="hero-location"
                      type="text"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      placeholder="Enter city (e.g. Bengaluru, Hyderabad)"
                      className="w-full min-h-[48px] pl-10 pr-36 rounded-input border border-gray-200 focus:border-brand-ink focus:ring-2 focus:ring-brand-ink/10 bg-gray-50 text-ds-14 font-semibold text-brand-ink outline-none"
                    />
                    <button
                      type="button"
                      onClick={requestGPSLocation}
                      disabled={locLoading}
                      className="absolute right-1.5 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-card bg-brand-yellowSoft hover:bg-brand-yellow border border-brand-yellow text-[11px] font-bold text-brand-ink transition-colors cursor-pointer"
                    >
                      <Navigation className="w-3 h-3" strokeWidth={2.3} />
                      {locLoading ? 'Detecting...' : 'Use my location'}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="hero-date" className="block text-ds-12 font-semibold text-gray-900">
                    Preferred date
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-gray-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="hero-date"
                      type="date"
                      min={todayIso}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full min-h-[48px] pl-10 pr-4 rounded-input border border-gray-200 focus:border-brand-ink focus:ring-2 focus:ring-brand-ink/10 bg-gray-50 text-ds-14 font-semibold text-brand-ink outline-none"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="accent"
                  size="lg"
                  fullWidth
                  rightIcon={<ArrowRight className="w-5 h-5" strokeWidth={2.2} />}
                >
                  Find pros
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Category Grid (5 columns x 2 rows on desktop) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
          <div>
            <span className="text-ds-12 font-bold uppercase tracking-wider text-gray-600">
              10 Core Categories
            </span>
            <h2 className="font-display font-bold text-ds-24 sm:text-ds-32 text-brand-ink tracking-tight mt-0.5">
              What needs fixing today?
            </h2>
          </div>
          <Link
            to="/services"
            className="text-ds-14 font-bold text-brand-ink hover:underline inline-flex items-center gap-1 shrink-0"
          >
            Browse All Services <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categoryTiles.map((svc) => {
            const Icon = getServiceIconComponent(svc);
            const hasRealId = services.some((s) => s.id === svc.id);
            return (
              <button
                key={svc.id}
                type="button"
                onClick={() =>
                  hasRealId
                    ? navigate(`/providers/nearby?serviceId=${svc.id}`)
                    : navigate(`/services?q=${encodeURIComponent(svc.name)}`)
                }
                className="bg-brand-white border border-gray-200 hover:border-brand-ink rounded-card p-5 flex flex-col items-center text-center gap-3 shadow-card hover:shadow-card-hover hover:-translate-y-1 active:scale-[0.98] transition-all duration-150 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink"
              >
                <div className="w-14 h-14 rounded-card bg-brand-yellowSoft border border-brand-yellow text-brand-ink group-hover:bg-brand-ink group-hover:text-brand-yellow group-hover:border-brand-ink flex items-center justify-center transition-colors duration-150">
                  <Icon className="w-7 h-7" strokeWidth={2} />
                </div>
                <div className="space-y-1 w-full">
                  <span className="block font-display font-bold text-ds-14 text-brand-ink truncate">
                    {svc.name}
                  </span>
                  <span className="block text-ds-12 font-semibold text-gray-600">
                    from Rs {getServiceStartingPrice(svc)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Trust Strip */}
      <section className="bg-brand-yellow border-y border-brand-yellowHover">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {TRUST_PILLARS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3 justify-start lg:justify-center">
                  <div className="w-10 h-10 rounded-pill bg-brand-ink text-brand-yellow flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" strokeWidth={2.2} />
                  </div>
                  <span className="font-display font-bold text-ds-14 text-brand-ink">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. How It Works (3-Column Section with Numbered Steps) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <span className="inline-block px-3 py-1 rounded-pill bg-gray-100 text-ds-12 font-bold text-brand-ink">
            Simple 3-Step Flow
          </span>
          <h2 className="font-display font-bold text-ds-24 sm:text-ds-32 text-brand-ink tracking-tight">
            How LocalGo works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-gray-50 border border-gray-200 hover:border-gray-400 rounded-card p-6 space-y-4 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-card bg-brand-ink text-brand-yellow flex items-center justify-center shadow-card">
                    <Icon className="w-6 h-6" strokeWidth={2} />
                  </div>
                  <span className="font-display font-extrabold text-ds-32 text-gray-200">
                    {item.step}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display font-bold text-ds-20 text-brand-ink">{item.title}</h3>
                  <p className="text-ds-14 text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Stats Band */}
      <section className="bg-brand-ink text-brand-white border-y border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {statsSummary.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-gray-900/90 border border-gray-600/30 rounded-card p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-ds-12 font-semibold text-gray-400">{stat.label}</span>
                    <Icon className="w-4 h-4 text-brand-yellow" />
                  </div>
                  <div className="font-display font-extrabold text-ds-32 text-brand-white">
                    {stat.value}
                  </div>
                  <div className="text-[11px] text-gray-400">{stat.caption}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Top-Rated Providers 4-Column Grid */}
      <section className="bg-gray-50 border-b border-gray-200 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-7">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-ds-12 font-bold uppercase tracking-wider text-gray-600">
                Top Rated in {location?.city || 'Your Area'}
              </span>
              <h2 className="font-display font-bold text-ds-24 sm:text-ds-32 text-brand-ink tracking-tight mt-0.5">
                Highest-rated professionals
              </h2>
            </div>

            <Link
              to="/providers"
              className="text-ds-14 font-bold text-brand-ink hover:underline inline-flex items-center gap-1.5 shrink-0"
            >
              View All Nearby Pros <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
            </Link>
          </div>

          {providersError ? (
            <ErrorState message={providersError} onRetry={() => fetchTopProviders()} compact />
          ) : loadingProviders || loadingServices ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {providers.map((p) => (
                <div
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/providers/${p.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/providers/${p.id}`);
                    }
                  }}
                  className="bg-brand-white border border-gray-200 hover:border-brand-ink rounded-card p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-150 cursor-pointer flex flex-col justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          src={getProviderAvatar(p.name)}
                          name={p.name}
                          size="md"
                          status={p.available ? 'online' : 'offline'}
                          verified={p.verificationStatus === 'VERIFIED'}
                        />
                        <div className="min-w-0">
                          <h3 className="font-display font-bold text-ds-16 text-brand-ink truncate">
                            {p.name}
                          </h3>
                          <p className="text-ds-12 text-gray-600 truncate">
                            {p.services?.[0]?.name || 'Verified Specialist'}
                          </p>
                        </div>
                      </div>
                      <Badge tone={p.available ? 'success' : 'neutral'} dot>
                        {p.available ? 'Online' : 'Offline'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-ds-12 font-semibold bg-gray-50 rounded-card px-3 py-2 border border-gray-100">
                      <span className="inline-flex items-center gap-1 text-brand-ink">
                        <Star className="w-4 h-4 fill-brand-yellow text-brand-yellow" />
                        {p.rating > 0 ? Number(p.rating).toFixed(1) : 'New'}
                      </span>
                      <span className="text-gray-600 inline-flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5" /> {p.completedJobs ?? 0}
                      </span>
                      <span className="text-gray-600 truncate max-w-[90px]">
                        {p.distanceKm != null ? `${Number(p.distanceKm).toFixed(1)} km` : p.serviceArea}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
                    <div>
                      <span className="text-[11px] font-semibold text-gray-400 uppercase block">Starts at</span>
                      <span className="font-display font-bold text-ds-20 text-brand-ink">
                        {formatCurrency(p.startingPrice)}
                      </span>
                    </div>
                    <Button
                      variant={p.available ? 'accent' : 'secondary'}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(p.available ? `/book/${p.id}` : `/providers/${p.id}`);
                      }}
                    >
                      {p.available ? 'Book' : 'View'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 7. Customer Testimonials (3-Column) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="inline-block px-3 py-1 rounded-pill bg-brand-yellowSoft border border-brand-yellow text-ds-12 font-bold text-brand-ink">
            Customer Stories
          </span>
          <h2 className="font-display font-bold text-ds-24 sm:text-ds-32 text-brand-ink tracking-tight">
            Trusted by homeowners every day
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="bg-brand-white border border-gray-200 hover:border-gray-400 rounded-card p-6 shadow-card flex flex-col justify-between gap-4 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <RatingStars rating={t.rating} size="sm" />
                  <Quote className="w-5 h-5 text-brand-yellow" strokeWidth={2} />
                </div>
                <p className="text-ds-14 text-gray-900 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                <Avatar name={t.name} size="sm" tone="yellow" />
                <div>
                  <div className="font-display font-bold text-ds-14 text-brand-ink">{t.name}</div>
                  <div className="text-ds-12 text-gray-600">{t.service} &bull; {t.city}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. Become a Partner Split Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-brand-ink text-brand-white rounded-sheet p-7 sm:p-10 bg-dark-grid-pattern border border-gray-900 grid grid-cols-1 lg:grid-cols-12 items-center gap-8 shadow-sheet">
          <div className="lg:col-span-8 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-brand-yellow text-brand-ink text-ds-12 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />
              Partner With LocalGo
            </span>
            <h2 className="font-display font-bold text-ds-24 sm:text-ds-32 tracking-tight text-brand-white">
              Are you a skilled technician? Grow your earnings with LocalGo.
            </h2>
            <p className="text-ds-14 text-gray-400 max-w-2xl">
              Go online on your schedule, accept nearby doorstep bookings, verify jobs via 4-digit OTP, and build verified customer ratings.
            </p>
          </div>

          <div className="lg:col-span-4 flex lg:justify-end">
            <a
              href={providerPortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 min-h-[52px] px-7 py-3.5 rounded-card bg-brand-yellow hover:bg-brand-yellowHover text-brand-ink font-display font-bold text-ds-16 transition-all duration-150 shadow-card shrink-0"
            >
              Open Partner Portal <ArrowRight className="w-5 h-5" strokeWidth={2.2} />
            </a>
          </div>
        </div>
      </section>

      <LocationSheet
        open={locationSheetOpen}
        onClose={() => setLocationSheetOpen(false)}
        location={location}
        error={locError}
        loading={locLoading}
        usingGPS={usingGPS}
        onRequestGPS={requestGPSLocation}
        onSelectManual={selectManualLocation}
        predefinedLocations={predefinedLocations}
      />
    </div>
  );
};
