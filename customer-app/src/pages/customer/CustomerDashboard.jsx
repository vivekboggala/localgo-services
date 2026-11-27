import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import {
  MapPin,
  Search,
  ChevronDown,
  ArrowRight,
  Clock,
  RotateCcw,
  ShieldCheck,
  Navigation,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../hooks/useLocation';
import { useLiveSync } from '../../hooks/useLiveSync';
import { providerService } from '../../services/providerService';
import { serviceService } from '../../services/serviceService';
import { bookingService } from '../../services/bookingService';
import { ProviderMap } from '../../components/map/ProviderMap';
import { ProviderCard } from '../../components/customer/ProviderCard';
import {
  Button,
  EmptyState,
  ErrorState,
  Input,
  SkeletonCard,
  StatusBadge,
} from '../../components/ui';
import { LocationSheet } from '../../components/customer/LocationSheet';
import {
  formatCurrency,
  getServiceIconComponent,
  getServiceStartingPrice,
} from '../../utils/helpers';

const ACTIVE_STATUSES = ['REQUESTED', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS'];

export const CustomerDashboard = () => {
  const { user, firebaseUser } = useAuth();
  const uid = firebaseUser?.uid || user?.id;
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
  const [loadingServices, setLoadingServices] = useState(true);
  const [nearbyProviders, setNearbyProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [apiError, setApiError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationSheetOpen, setLocationSheetOpen] = useState(false);

  const navigate = useNavigate();

  const loadServices = useCallback(() => {
    setLoadingServices(true);
    serviceService.getAllServices()
      .then((data) => setServices(Array.isArray(data) ? data.slice(0, 8) : []))
      .catch((err) => setApiError((prev) => prev || err.response?.data?.message || 'Unable to load services.'))
      .finally(() => setLoadingServices(false));
  }, []);

  const fetchNearbyProviders = useCallback(({ silent = false } = {}) => {
    if (!location?.lat || !location?.lng) return;
    if (!silent) {
      setLoadingProviders(true);
      setApiError('');
    }
    providerService.getNearbyProviders(location.lat, location.lng, 15)
      .then((data) => {
        setNearbyProviders(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!silent) {
          setNearbyProviders([]);
          setApiError(err.response?.data?.message || 'Could not reach server to fetch nearby pros.');
        }
      })
      .finally(() => {
        if (!silent) setLoadingProviders(false);
      });
  }, [location?.lat, location?.lng]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  useEffect(() => {
    fetchNearbyProviders();
  }, [fetchNearbyProviders]);

  useEffect(() => {
    if (!uid) return;
    bookingService.getMyBookings()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.content || []);
        setBookings(list);
      })
      .catch(() => {});

    const q = query(collection(db, 'bookings'), where('customerId', '==', uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setBookings((prev) => {
          const prevMap = new Map(prev.map((item) => [item.id, item]));
          const liveList = snapshot.docs.map((docSnap) => {
            const d = docSnap.data();
            const existing = prevMap.get(docSnap.id);
            const amountInRupees = d.amount != null ? Number(d.amount) / 100 : 0;
            const extraAmount = (d.extraAmountPaise || 0) / 100;
            return {
              id: docSnap.id,
              ...d,
              amount: amountInRupees,
              extraAmount,
              totalAmount: amountInRupees + extraAmount,
              startOtp: d.startOtp ?? existing?.startOtp,
            };
          });
          liveList.sort((a, b) => {
            const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
            const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
            return tB - tA;
          });
          return liveList.length > 0 ? liveList : prev;
        });
      },
      () => {}
    );
    return () => unsubscribe();
  }, [uid]);

  useLiveSync(() => fetchNearbyProviders({ silent: true }), {
    enabled: Boolean(location?.lat && location?.lng),
    watchProviders: true,
  });

  const activeBooking = useMemo(
    () => bookings.find((b) => ACTIVE_STATUSES.includes(b.status)) || null,
    [bookings]
  );

  const recentBookings = useMemo(
    () => bookings.filter((b) => b.status === 'COMPLETED' || b.status === 'CANCELLED').slice(0, 6),
    [bookings]
  );

  const onlineProviders = useMemo(() => {
    const online = nearbyProviders.filter((p) => p.available);
    return online.length > 0 ? online : nearbyProviders;
  }, [nearbyProviders]);

  const greetingHour = new Date().getHours();
  const greetingPrefix =
    greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN (8 Cols): Greeting, Search, Categories, Nearby Pros, Book Again */}
        <div className="lg:col-span-8 space-y-8">
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-ds-12 font-semibold text-gray-600">{greetingPrefix}</p>
                <h1 className="font-display font-bold text-ds-24 sm:text-ds-32 text-brand-ink tracking-tight">
                  Welcome back, {user?.name?.split(' ')[0] || 'there'}
                </h1>
              </div>

              <button
                type="button"
                onClick={() => setLocationSheetOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 self-start min-h-[44px] px-4 py-2 rounded-pill bg-brand-yellowSoft border border-brand-yellow text-brand-ink font-semibold text-ds-12 hover:bg-brand-yellow transition-colors cursor-pointer"
              >
                <MapPin className="w-4 h-4 shrink-0" strokeWidth={2.2} />
                <span className="truncate max-w-[180px]">{location?.city || 'Select Location'}</span>
                <ChevronDown className="w-4 h-4 shrink-0" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                navigate(searchQuery.trim() ? `/services?q=${encodeURIComponent(searchQuery)}` : '/services');
              }}
              className="flex gap-2.5"
            >
              <div className="flex-1">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for AC repair, plumber, electrician..."
                  aria-label="Search home services"
                  leftIcon={<Search className="w-5 h-5" strokeWidth={2} />}
                />
              </div>
              <Button type="submit" variant="primary" className="shrink-0 px-6">
                Search
              </Button>
            </form>
          </section>

          {apiError && (
            <ErrorState
              compact
              message={apiError}
              onRetry={() => {
                loadServices();
                fetchNearbyProviders();
              }}
            />
          )}

          {/* Category Tiles */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-ds-20 text-brand-ink tracking-tight">
                What do you need?
              </h2>
              <Link
                to="/services"
                className="text-ds-14 font-bold text-brand-ink hover:underline inline-flex items-center gap-1"
              >
                See all <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </Link>
            </div>

            {loadingServices ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {[1, 2, 3, 4].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {services.slice(0, 8).map((s) => {
                  const Icon = getServiceIconComponent(s);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => navigate(`/providers/nearby?serviceId=${s.id}`)}
                      className="bg-brand-white border border-gray-200 hover:border-brand-ink rounded-card p-3.5 text-left flex items-center gap-3 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-150 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink"
                    >
                      <div className="w-11 h-11 rounded-card bg-brand-yellowSoft border border-brand-yellow text-brand-ink group-hover:bg-brand-ink group-hover:text-brand-yellow group-hover:border-brand-ink flex items-center justify-center shrink-0 transition-colors">
                        <Icon className="w-5 h-5" strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-display font-bold text-ds-14 text-brand-ink truncate">
                          {s.name}
                        </div>
                        <div className="text-[11px] font-semibold text-gray-600">
                          from Rs {getServiceStartingPrice(s)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Nearby Pros Online Now Grid */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-ds-20 text-brand-ink tracking-tight">
                  Nearby pros online now
                </h2>
                <p className="text-ds-12 text-gray-600">
                  Live verified pros near {location?.city || 'your area'}
                </p>
              </div>
              <Link
                to="/providers"
                className="text-ds-14 font-bold text-brand-ink hover:underline inline-flex items-center gap-1"
              >
                All pros <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </Link>
            </div>

            {loadingProviders ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : onlineProviders.length === 0 ? (
              <EmptyState
                icon={<Navigation className="w-7 h-7" strokeWidth={2} />}
                title="No providers nearby yet"
                description="Try expanding your search area or picking another city."
                actionLabel="Change Location"
                actionVariant="accent"
                onAction={() => setLocationSheetOpen(true)}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {onlineProviders.slice(0, 6).map((p) => (
                  <ProviderCard key={p.id} provider={p} compact />
                ))}
              </div>
            )}
          </section>

          {/* Recent Bookings / Book Again */}
          {recentBookings.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-ds-20 text-brand-ink tracking-tight">
                  Book again
                </h2>
                <Link
                  to="/my-bookings"
                  className="text-ds-14 font-bold text-brand-ink hover:underline inline-flex items-center gap-1"
                >
                  History <ArrowRight className="w-4 h-4" strokeWidth={2} />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recentBookings.slice(0, 4).map((b) => (
                  <div
                    key={b.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/bookings/${b.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/bookings/${b.id}`);
                      }
                    }}
                    className="bg-brand-white border border-gray-200 hover:border-brand-ink rounded-card p-4 shadow-card hover:shadow-card-hover flex items-center justify-between gap-3 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-ds-14 text-brand-ink truncate">
                          {b.serviceName}
                        </h3>
                        <StatusBadge status={b.status} showDot={false} />
                      </div>
                      <p className="text-ds-12 text-gray-600 truncate">
                        {b.providerName} &bull; {formatCurrency(b.amount)}
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/book/${b.providerId}?serviceId=${b.serviceId}`, {
                          state: { prefillDescription: b.description, prefillAddress: b.address },
                        });
                      }}
                      leftIcon={<RotateCcw className="w-3.5 h-3.5 text-brand-yellow" />}
                      className="min-h-[40px] py-1.5 px-3 text-ds-12 shrink-0"
                    >
                      Book again
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN (4 Cols, Sticky): Active Booking, Saved Location Map Preview, Promo */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-5">
          {/* Active Booking Card */}
          {activeBooking ? (
            <div className="bg-brand-ink text-brand-white rounded-sheet p-5 border border-gray-900 shadow-sheet space-y-4">
              <div className="flex items-center justify-between gap-2">
                <StatusBadge status={activeBooking.status} />
                <span className="inline-flex items-center gap-1 text-ds-12 text-brand-yellow font-semibold">
                  <Clock className="w-3.5 h-3.5" strokeWidth={2.2} />
                  {activeBooking.status === 'ON_THE_WAY'
                    ? 'ETA ~15 mins'
                    : `${activeBooking.scheduledDate}`}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Active Booking
                </span>
                <h2 className="font-display font-bold text-ds-20 text-brand-white">
                  {activeBooking.serviceName || 'Ongoing Service'}
                </h2>
                <p className="text-ds-12 text-gray-400">
                  Pro: <strong className="text-brand-white">{activeBooking.providerName}</strong>
                </p>
              </div>

              {activeBooking.startOtp && ['ACCEPTED', 'ON_THE_WAY', 'ARRIVED'].includes(activeBooking.status) && (
                <div className="bg-gray-900 border border-gray-600/30 rounded-card p-3 flex items-center justify-between">
                  <span className="text-ds-12 text-gray-400 font-semibold">Start OTP</span>
                  <span className="font-display font-extrabold text-ds-20 text-brand-yellow tracking-widest">
                    {activeBooking.startOtp}
                  </span>
                </div>
              )}

              <Button
                variant="accent"
                fullWidth
                onClick={() => navigate(`/bookings/${activeBooking.id}`)}
                rightIcon={<ArrowRight className="w-4 h-4" strokeWidth={2.2} />}
              >
                Track Live Trip
              </Button>
            </div>
          ) : (
            <div className="bg-brand-white border border-gray-200 rounded-card p-5 shadow-card space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-card bg-brand-yellowSoft border border-brand-yellow text-brand-ink flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-ds-16 text-brand-ink">No active bookings</h2>
                  <p className="text-ds-12 text-gray-600">Pick a pro and schedule a visit anytime</p>
                </div>
              </div>
              <Button variant="accent" fullWidth onClick={() => navigate('/providers')}>
                Browse Nearby Pros
              </Button>
            </div>
          )}

          {/* Saved Location Card with Mini Live Map Preview */}
          <div className="bg-brand-white border border-gray-200 rounded-card p-5 shadow-card space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                  Current Service Zone
                </span>
                <h3 className="font-display font-bold text-ds-16 text-brand-ink truncate mt-0.5 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-brand-ink shrink-0" />
                  {location?.city || 'Bengaluru'}
                  {usingGPS && (
                    <span className="px-2 py-0.5 rounded-pill bg-status-success text-brand-white text-[10px] font-bold">
                      GPS
                    </span>
                  )}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLocationSheetOpen(true)}
                className="text-ds-12 font-bold text-brand-ink px-3 py-1.5 rounded-pill bg-gray-100 hover:bg-brand-yellowSoft border border-gray-200 cursor-pointer shrink-0 transition-colors"
              >
                Change
              </button>
            </div>

            <div className="h-44 rounded-card overflow-hidden border border-gray-200">
              <ProviderMap
                customerLocation={location}
                providers={onlineProviders.slice(0, 6)}
              />
            </div>

            <Button variant="secondary" fullWidth onClick={() => navigate('/map')}>
              Open Full Interactive Map
            </Button>
          </div>

          {/* Promo Card */}
          <div className="bg-brand-yellow rounded-sheet p-5 border border-brand-yellowHover shadow-card space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-card bg-brand-ink text-brand-yellow flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" strokeWidth={2} />
              </div>
              <div>
                <div className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-brand-ink">
                  <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2.5} /> Zero Hidden Visit Fees
                </div>
                <h3 className="font-display font-bold text-ds-16 text-brand-ink">
                  OTP-Secured Doorstep Service
                </h3>
              </div>
            </div>
            <p className="text-ds-12 text-gray-900 leading-relaxed">
              Verified arrival with 4-digit Start OTP and upfront starting prices before you book.
            </p>
            <Button
              variant="primary"
              fullWidth
              onClick={() => navigate('/services')}
              rightIcon={<ArrowRight className="w-4 h-4" strokeWidth={2.2} />}
            >
              Book a Service
            </Button>
          </div>
        </aside>
      </div>

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
