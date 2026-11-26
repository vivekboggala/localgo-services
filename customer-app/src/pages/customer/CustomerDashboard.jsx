import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import {
  MapPin,
  Search,
  ChevronDown,
  ArrowRight,
  Clock,
  Star,
  RotateCcw,
  ShieldCheck,
  Navigation,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../hooks/useLocation';
import { useLiveSync } from '../../hooks/useLiveSync';
import { providerService } from '../../services/providerService';
import { serviceService } from '../../services/serviceService';
import { bookingService } from '../../services/bookingService';
import {
  Avatar,
  Badge,
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
  getProviderAvatar,
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
        const liveList = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            ...d,
            amount: d.amount != null ? Number(d.amount) / 100 : 0,
          };
        });
        liveList.sort((a, b) => {
          const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
          const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
          return tB - tA;
        });
        if (liveList.length > 0) setBookings(liveList);
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
    () => bookings.filter((b) => b.status === 'COMPLETED' || b.status === 'CANCELLED').slice(0, 5),
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-7">
      {/* Greeting + Location Chip + Quick Search */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-ds-12 font-semibold text-gray-600">{greetingPrefix}</p>
            <h1 className="font-display font-bold text-ds-24 sm:text-ds-32 text-brand-ink tracking-tight">
              Hi, {user?.name?.split(' ')[0] || 'there'}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setLocationSheetOpen(true)}
            className="inline-flex items-center gap-2 self-start sm:self-auto min-h-[44px] px-4 py-2 rounded-pill bg-brand-yellowSoft border border-brand-yellow text-brand-ink font-semibold text-ds-12 hover:bg-brand-yellow transition-colors duration-150 cursor-pointer"
          >
            <MapPin className="w-4 h-4 shrink-0" strokeWidth={2.2} />
            <span className="truncate max-w-[200px]">
              {location?.city || 'Select Location'}
            </span>
            {usingGPS && (
              <span className="px-2 py-0.5 rounded-pill bg-status-success text-brand-white text-[10px] font-bold">
                GPS
              </span>
            )}
            <ChevronDown className="w-4 h-4 shrink-0" strokeWidth={2} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate(searchQuery.trim() ? `/services?q=${encodeURIComponent(searchQuery)}` : '/services');
          }}
          className="flex gap-2"
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
          <Button type="submit" variant="primary" className="shrink-0 px-5">
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

      {/* Active Booking Banner Card */}
      {activeBooking && (
        <section aria-label="Active booking">
          <div className="bg-brand-ink text-brand-white rounded-sheet p-5 border border-gray-900 shadow-sheet flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={activeBooking.status} />
                <span className="inline-flex items-center gap-1 text-ds-12 text-brand-yellow font-semibold">
                  <Clock className="w-3.5 h-3.5" strokeWidth={2.2} />
                  {activeBooking.status === 'ON_THE_WAY'
                    ? 'Arriving in ~15 mins'
                    : `${activeBooking.scheduledDate} at ${activeBooking.scheduledTime}`}
                </span>
              </div>
              <div>
                <h2 className="font-display font-bold text-ds-20 text-brand-white">
                  {activeBooking.serviceName || 'Ongoing Service'}
                </h2>
                <p className="text-ds-12 text-gray-400">
                  Pro: <strong className="text-brand-white">{activeBooking.providerName}</strong>
                  {activeBooking.startOtp && ['ACCEPTED', 'ON_THE_WAY', 'ARRIVED'].includes(activeBooking.status)
                    ? ` • Start OTP: ${activeBooking.startOtp}`
                    : ''}
                </p>
              </div>
            </div>

            <Button
              variant="accent"
              onClick={() => navigate(`/bookings/${activeBooking.id}`)}
              rightIcon={<ArrowRight className="w-4 h-4" strokeWidth={2.2} />}
              className="w-full sm:w-auto shrink-0"
            >
              View Live Trip
            </Button>
          </div>
        </section>
      )}

      {/* What do you need? Top 8 Categories */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-ds-20 text-brand-ink tracking-tight">
            What do you need?
          </h2>
          <Link
            to="/services"
            className="text-ds-12 font-bold text-brand-ink hover:underline inline-flex items-center gap-1"
          >
            See all <ArrowRight className="w-4 h-4" strokeWidth={2} />
          </Link>
        </div>

        {loadingServices ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {services.slice(0, 8).map((s) => {
              const Icon = getServiceIconComponent(s);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => navigate(`/providers/nearby?serviceId=${s.id}`)}
                  className="bg-brand-white border border-gray-200 hover:border-brand-ink rounded-card p-3.5 text-left flex items-center gap-3 shadow-card hover:shadow-card-hover active:scale-[0.98] transition-all duration-150 group"
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

      {/* Nearby Pros Online Now Horizontal List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-ds-20 text-brand-ink tracking-tight">
              Nearby pros online now
            </h2>
            <p className="text-ds-12 text-gray-600">Tap to book or open live map view</p>
          </div>
          <Link
            to="/providers"
            className="text-ds-12 font-bold text-brand-ink hover:underline inline-flex items-center gap-1"
          >
            All pros <ArrowRight className="w-4 h-4" strokeWidth={2} />
          </Link>
        </div>

        {loadingProviders ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
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
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
            {onlineProviders.slice(0, 10).map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/providers/${p.id}`)}
                className="min-w-[270px] sm:min-w-[300px] snap-start bg-brand-white border border-gray-200 hover:border-brand-ink rounded-card p-4 shadow-card hover:shadow-card-hover transition-all duration-150 cursor-pointer flex flex-col justify-between gap-3 shrink-0"
              >
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
                      <h3 className="font-display font-bold text-ds-14 text-brand-ink truncate">
                        {p.name}
                      </h3>
                      <p className="text-ds-12 text-gray-600 truncate">
                        {p.services?.[0]?.name || 'Verified Pro'}
                      </p>
                    </div>
                  </div>
                  <Badge tone={p.available ? 'success' : 'neutral'} dot>
                    {p.available ? 'Online' : 'Offline'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-ds-12 font-semibold text-gray-600 bg-gray-50 rounded-card px-3 py-2">
                  <span className="inline-flex items-center gap-1 text-brand-ink">
                    <Star className="w-3.5 h-3.5 fill-brand-yellow text-brand-yellow" />
                    {p.rating > 0 ? Number(p.rating).toFixed(1) : 'New'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" /> {p.completedJobs ?? 0}
                  </span>
                  <span>
                    {p.distanceKm != null ? `${Number(p.distanceKm).toFixed(1)} km` : p.serviceArea}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="font-display font-bold text-ds-16 text-brand-ink">
                    {formatCurrency(p.startingPrice)}
                  </span>
                  <Button
                    variant={p.available ? 'accent' : 'secondary'}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(p.available ? `/book/${p.id}` : `/providers/${p.id}`);
                    }}
                    className="min-h-[40px] py-1.5 px-4 text-ds-12"
                  >
                    {p.available ? 'Book' : 'View'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Bookings / Book Again */}
      {recentBookings.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-ds-20 text-brand-ink tracking-tight">
              Recent bookings &bull; Book again
            </h2>
            <Link
              to="/my-bookings"
              className="text-ds-12 font-bold text-brand-ink hover:underline inline-flex items-center gap-1"
            >
              History <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1 snap-x">
            {recentBookings.map((b) => (
              <div
                key={b.id}
                onClick={() => navigate(`/bookings/${b.id}`)}
                className="min-w-[260px] snap-start bg-gray-50 border border-gray-200 hover:border-brand-ink rounded-card p-4 flex flex-col justify-between gap-3 cursor-pointer shrink-0 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-ds-14 text-brand-ink truncate">
                      {b.serviceName}
                    </h3>
                    <p className="text-ds-12 text-gray-600 truncate">{b.providerName}</p>
                  </div>
                  <StatusBadge status={b.status} showDot={false} />
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-200/70">
                  <span className="font-display font-bold text-ds-14 text-brand-ink">
                    {formatCurrency(b.amount)}
                  </span>
                  <Button
                    variant="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/book/${b.providerId}?serviceId=${b.serviceId}`, {
                        state: { prefillDescription: b.description, prefillAddress: b.address },
                      });
                    }}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5 text-brand-yellow" />}
                    className="min-h-[38px] py-1.5 px-3 text-ds-12"
                  >
                    Book again
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Promo Banner */}
      <section className="bg-brand-yellow rounded-sheet p-5 sm:p-7 border border-brand-yellowHover shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-card bg-brand-ink text-brand-yellow flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" strokeWidth={2} />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-brand-ink">
              <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2.5} /> Zero Hidden Visit Fees
            </div>
            <h3 className="font-display font-bold text-ds-20 text-brand-ink">
              Explore pros near you on the live map
            </h3>
            <p className="text-ds-12 text-gray-900">
              See who is online in your neighborhood right now and book in 60 seconds.
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/map')}
          rightIcon={<ArrowRight className="w-4 h-4" strokeWidth={2.2} />}
          className="shrink-0"
        >
          Open Live Map
        </Button>
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
