import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Search,
  ShieldCheck,
  KeyRound,
  Navigation,
  Star,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  MousePointerClick,
  CalendarCheck,
  Smile,
  Briefcase,
  Quote,
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

  const [services, setServices] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [providersError, setProvidersError] = useState('');
  const [locationInput, setLocationInput] = useState(location?.city || '');
  const [locationSheetOpen, setLocationSheetOpen] = useState(false);

  const carouselRef = useRef(null);
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
        navigate('/providers');
        return;
      }
      navigate(`/services?q=${encodeURIComponent(trimmed)}`);
      return;
    }
    navigate('/services');
  };

  const scrollCarousel = (dir) => {
    if (!carouselRef.current) return;
    carouselRef.current.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  const categoryTiles = services.length > 0
    ? services.slice(0, 10)
    : DEFAULT_CATEGORY_TILES;

  const providerPortalUrl = import.meta.env.VITE_PROVIDER_APP_URL || 'http://localhost:5174';

  return (
    <div className="bg-brand-white">
      {/* 1. Full-Width Dark Hero with Yellow Accents */}
      <section className="bg-brand-ink text-brand-white bg-dark-grid-pattern border-b border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-pill bg-gray-900 border border-gray-600/40 text-ds-12 font-semibold text-brand-yellow">
                <span className="w-2 h-2 rounded-full bg-brand-yellow animate-pulse" />
                On-demand home pros &bull; Instant booking
              </div>

              <h1 className="font-display font-extrabold text-ds-32 sm:text-ds-40 lg:text-[48px] tracking-tight leading-[1.08] text-brand-white">
                Trusted home services,{' '}
                <span className="text-brand-yellow">at your doorstep</span>
              </h1>

              <p className="text-ds-16 text-gray-400 max-w-xl leading-relaxed">
                Find verified plumbers, electricians, AC technicians, and home cleaners nearby with live arrival tracking and OTP-verified service start.
              </p>

              {/* Location Input + Yellow Find Services Button */}
              <form
                onSubmit={handleHeroSubmit}
                className="bg-brand-white p-2 rounded-sheet shadow-sheet flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-xl"
              >
                <div className="relative flex-1 flex items-center">
                  <MapPin className="w-5 h-5 text-brand-ink absolute left-3.5 pointer-events-none" strokeWidth={2.2} />
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder="Enter city or service (e.g. Bengaluru, AC Repair)"
                    aria-label="Enter your city or service"
                    className="w-full min-h-[48px] pl-11 pr-24 py-2.5 text-ds-14 font-semibold text-brand-ink placeholder:text-gray-400 bg-transparent outline-none rounded-card"
                  />
                  <button
                    type="button"
                    onClick={() => setLocationSheetOpen(true)}
                    className="absolute right-2 px-2.5 py-1.5 rounded-pill bg-gray-100 hover:bg-brand-yellowSoft text-ds-12 font-bold text-brand-ink transition-colors"
                  >
                    Pick City
                  </button>
                </div>

                <Button
                  type="submit"
                  variant="accent"
                  size="lg"
                  rightIcon={<ArrowRight className="w-5 h-5" strokeWidth={2.2} />}
                  className="whitespace-nowrap"
                >
                  Find services
                </Button>
              </form>

              <div className="flex flex-wrap items-center gap-3 text-ds-12 text-gray-400">
                <button
                  type="button"
                  onClick={requestGPSLocation}
                  disabled={locLoading}
                  className="inline-flex items-center gap-1.5 text-brand-yellow font-semibold hover:underline cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" strokeWidth={2.2} />
                  {locLoading ? 'Detecting GPS...' : 'Use my current GPS location'}
                </button>
                <span>&bull;</span>
                <span>Current zone: <strong className="text-brand-white">{location?.city || 'Bengaluru'}</strong></span>
              </div>
            </div>

            {/* Right Visual Live Dispatch Card */}
            <div className="lg:col-span-5">
              <div className="bg-gray-900 border border-gray-600/30 rounded-sheet p-5 sm:p-6 shadow-sheet space-y-4">
                <div className="flex items-center justify-between border-b border-gray-600/30 pb-3.5">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-brand-yellow">
                      Live Dispatch
                    </span>
                    <h2 className="font-display font-bold text-ds-20 text-brand-white mt-0.5">
                      Ready Nearby Now
                    </h2>
                  </div>
                  <Badge tone="success" dot>
                    Active Zone
                  </Badge>
                </div>

                <div className="space-y-2.5">
                  {(providers.length > 0 ? providers.slice(0, 3) : []).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => navigate(`/providers/${p.id}`)}
                      className="w-full text-left bg-brand-ink/80 hover:bg-brand-ink border border-gray-600/30 hover:border-brand-yellow/60 rounded-card p-3.5 flex items-center justify-between gap-3 transition-all duration-150"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          src={getProviderAvatar(p.name)}
                          name={p.name}
                          size="md"
                          status={p.available ? 'online' : 'offline'}
                          verified={p.verificationStatus === 'VERIFIED'}
                        />
                        <div className="min-w-0">
                          <div className="font-display font-bold text-ds-14 text-brand-white truncate">
                            {p.name}
                          </div>
                          <div className="text-ds-12 text-gray-400 flex items-center gap-2 mt-0.5">
                            <span className="inline-flex items-center gap-1 text-brand-yellow font-semibold">
                              <Star className="w-3.5 h-3.5 fill-brand-yellow" />
                              {p.rating > 0 ? Number(p.rating).toFixed(1) : 'New'}
                            </span>
                            <span>&bull;</span>
                            <span className="truncate">{p.distanceKm != null ? `${p.distanceKm} km away` : p.serviceArea}</span>
                          </div>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-pill bg-brand-yellow text-brand-ink font-display font-bold text-ds-12 shrink-0">
                        {formatCurrency(p.startingPrice)}
                      </span>
                    </button>
                  ))}

                  {!loadingProviders && providers.length === 0 && (
                    <div className="bg-brand-ink/70 border border-gray-600/30 rounded-card p-5 text-center space-y-2">
                      <p className="text-ds-14 font-semibold text-brand-white">
                        Explore verified home specialists
                      </p>
                      <p className="text-ds-12 text-gray-400">
                        Select your city above or browse the full service catalog.
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  variant="accent"
                  fullWidth
                  onClick={() => navigate('/map')}
                  leftIcon={<MapPin className="w-4 h-4" strokeWidth={2.2} />}
                >
                  Open Live Provider Map
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Row of 10 Category Icon Tiles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-end justify-between gap-4 mb-6">
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
            All Services <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-3">
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
                className="bg-brand-white border border-gray-200 hover:border-brand-ink rounded-card p-3.5 flex flex-col items-center text-center gap-2.5 shadow-card hover:shadow-card-hover active:scale-95 transition-all duration-150 group"
              >
                <div className="w-12 h-12 rounded-card bg-brand-yellowSoft border border-brand-yellow text-brand-ink group-hover:bg-brand-ink group-hover:text-brand-yellow group-hover:border-brand-ink flex items-center justify-center transition-colors duration-150">
                  <Icon className="w-6 h-6" strokeWidth={2} />
                </div>
                <div className="space-y-0.5 w-full">
                  <span className="block font-display font-bold text-ds-12 text-brand-ink truncate">
                    {svc.name}
                  </span>
                  <span className="block text-[11px] font-medium text-gray-600">
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

      {/* 4. How It Works (Choose, Book, Relax) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <span className="inline-block px-3 py-1 rounded-pill bg-gray-100 text-ds-12 font-bold text-brand-ink">
            Simple 3-Step Flow
          </span>
          <h2 className="font-display font-bold text-ds-24 sm:text-ds-32 text-brand-ink tracking-tight">
            How LocalGo works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {HOW_IT_WORKS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-gray-50 border border-gray-200 rounded-card p-6 space-y-4 relative"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-card bg-brand-ink text-brand-yellow flex items-center justify-center shadow-card">
                    <Icon className="w-6 h-6" strokeWidth={2} />
                  </div>
                  <span className="font-display font-extrabold text-ds-24 text-gray-200">
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

      {/* 5. Top-Rated Providers Carousel */}
      <section className="bg-gray-50 border-y border-gray-200 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="text-ds-12 font-bold uppercase tracking-wider text-gray-600">
                Top Rated in {location?.city || 'Your Area'}
              </span>
              <h2 className="font-display font-bold text-ds-24 sm:text-ds-32 text-brand-ink tracking-tight mt-0.5">
                Highest-rated professionals
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollCarousel(-1)}
                aria-label="Scroll providers left"
                className="w-11 h-11 rounded-pill bg-brand-white border border-gray-200 hover:border-brand-ink flex items-center justify-center text-brand-ink transition-colors"
              >
                <ChevronLeft className="w-5 h-5" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel(1)}
                aria-label="Scroll providers right"
                className="w-11 h-11 rounded-pill bg-brand-white border border-gray-200 hover:border-brand-ink flex items-center justify-center text-brand-ink transition-colors"
              >
                <ChevronRight className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
          </div>

          {providersError ? (
            <ErrorState message={providersError} onRetry={() => fetchTopProviders()} compact />
          ) : loadingProviders ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth"
            >
              {providers.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/providers/${p.id}`)}
                  className="min-w-[290px] sm:min-w-[320px] max-w-[340px] snap-start bg-brand-white border border-gray-200 hover:border-brand-ink rounded-card p-5 shadow-card hover:shadow-card-hover transition-all duration-150 cursor-pointer flex flex-col justify-between gap-4 shrink-0"
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
                        <Briefcase className="w-3.5 h-3.5" /> {p.completedJobs ?? 0} jobs
                      </span>
                      <span className="text-gray-600">
                        {p.distanceKm != null ? `${Number(p.distanceKm).toFixed(1)} km` : p.serviceArea}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
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

      {/* 6. Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="inline-block px-3 py-1 rounded-pill bg-brand-yellowSoft border border-brand-yellow text-ds-12 font-bold text-brand-ink">
            Customer Stories
          </span>
          <h2 className="font-display font-bold text-ds-24 sm:text-ds-32 text-brand-ink tracking-tight">
            Trusted by homeowners every day
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="bg-brand-white border border-gray-200 rounded-card p-6 shadow-card flex flex-col justify-between gap-4"
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

      {/* 7. Become a Provider Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-brand-ink text-brand-white rounded-sheet p-7 sm:p-10 bg-dark-grid-pattern border border-gray-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sheet">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-brand-yellow text-brand-ink text-ds-12 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />
              Partner With LocalGo
            </span>
            <h2 className="font-display font-bold text-ds-24 sm:text-ds-32 tracking-tight text-brand-white">
              Are you a skilled technician? Earn with LocalGo.
            </h2>
            <p className="text-ds-14 text-gray-400">
              Go online whenever you&apos;re free, accept nearby bookings, verify jobs with OTP, and build verified customer reviews.
            </p>
          </div>

          <a
            href={providerPortalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 min-h-[52px] px-7 py-3.5 rounded-card bg-brand-yellow hover:bg-brand-yellowHover text-brand-ink font-display font-bold text-ds-16 transition-all duration-150 shadow-card shrink-0"
          >
            Become a Provider <ArrowRight className="w-5 h-5" strokeWidth={2.2} />
          </a>
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
