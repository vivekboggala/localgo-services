import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation as useReactLocation, useSearchParams } from 'react-router-dom';
import {
  Wrench,
  Calendar,
  MapPin,
  Wallet,
  Smartphone,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  Home,
  Briefcase,
  Plus,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { providerService } from '../../services/providerService';
import { bookingService } from '../../services/bookingService';
import { useLocation } from '../../hooks/useLocation';
import { useAuth } from '../../hooks/useAuth';
import { ProviderMap } from '../../components/map/ProviderMap';
import {
  Avatar,
  Badge,
  Button,
  Chip,
  ErrorState,
  Input,
  PageHeader,
  SkeletonCard,
  showToast,
} from '../../components/ui';
import { formatCurrency, getProviderAvatar } from '../../utils/helpers';

const WIZARD_STEPS = [
  { id: 1, title: 'Service & Issue', icon: Wrench },
  { id: 2, title: 'Date & Slot', icon: Calendar },
  { id: 3, title: 'Address', icon: MapPin },
  { id: 4, title: 'Pay & Confirm', icon: Wallet },
];

const QUICK_ISSUE_CHIPS = [
  'Not working properly',
  'Unusual noise / vibration',
  'Water or gas leakage',
  'Routine servicing & checkup',
  'Urgent inspection needed',
];

const TIME_SLOTS = [
  { value: '09:00', label: '09:00 AM', hour: 9 },
  { value: '10:00', label: '10:00 AM', hour: 10 },
  { value: '11:00', label: '11:00 AM', hour: 11 },
  { value: '12:00', label: '12:00 PM', hour: 12 },
  { value: '14:00', label: '02:00 PM', hour: 14 },
  { value: '15:00', label: '03:00 PM', hour: 15 },
  { value: '16:00', label: '04:00 PM', hour: 16 },
  { value: '17:00', label: '05:00 PM', hour: 17 },
  { value: '18:00', label: '06:00 PM', hour: 18 },
  { value: '19:00', label: '07:00 PM', hour: 19 },
];

const getUpcomingDates = () => {
  const days = [];
  const base = new Date();
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    days.push({
      iso,
      dayShort: i === 0 ? 'Today' : i === 1 ? 'Tmrw' : d.toLocaleDateString(undefined, { weekday: 'short' }),
      dayNum: d.getDate(),
      month: d.toLocaleDateString(undefined, { month: 'short' }),
    });
  }
  return days;
};

export const BookingFlow = () => {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const routerLocation = useReactLocation();
  const [searchParams] = useSearchParams();
  const { location } = useLocation();
  const { user } = useAuth();

  const prefillState = routerLocation.state || {};
  const queryServiceId = searchParams.get('serviceId');
  const dates = useMemo(() => getUpcomingDates(), []);

  const [step, setStep] = useState(1);
  const [provider, setProvider] = useState(null);
  const [selectedServiceId, setSelectedServiceId] = useState(queryServiceId || '');
  const [description, setDescription] = useState(prefillState.prefillDescription || '');
  const [scheduledDate, setScheduledDate] = useState(dates[0].iso);

  const isSlotUnavailable = (dateIso, hour) => {
    if (dateIso !== dates[0].iso) return false;
    const now = new Date();
    return hour <= now.getHours();
  };

  const [scheduledTime, setScheduledTime] = useState(() => {
    const firstAvailable = TIME_SLOTS.find((s) => !isSlotUnavailable(dates[0].iso, s.hour));
    return firstAvailable ? firstAvailable.value : '10:00';
  });

  const addressStorageKey = `localgo_saved_addresses_${user?.id || 'guest'}`;
  const [savedAddresses, setSavedAddresses] = useState(() => {
    try {
      const stored = localStorage.getItem(addressStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    const defaults = [];
    if (user?.address) {
      defaults.push({
        id: 'addr-default',
        label: 'Home',
        address: user.address,
        city: user.city || location?.city || 'Local Area',
        postalCode: user.postalCode || '',
      });
    }
    return defaults;
  });

  const [selectedAddressId, setSelectedAddressId] = useState(
    prefillState.prefillAddress ? 'custom' : savedAddresses[0]?.id || 'new'
  );
  const [showAddAddress, setShowAddAddress] = useState(savedAddresses.length === 0 || Boolean(prefillState.prefillAddress));
  const [newLabel, setNewLabel] = useState('Home');
  const [address, setAddress] = useState(prefillState.prefillAddress || savedAddresses[0]?.address || user?.address || '');
  const [city, setCity] = useState(savedAddresses[0]?.city || user?.city || location?.city || '');
  const [postalCode, setPostalCode] = useState(savedAddresses[0]?.postalCode || user?.postalCode || '');
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  useEffect(() => {
    setLoading(true);
    setLoadError('');
    providerService.getProviderById(providerId)
      .then((data) => {
        setProvider(data);
        if (!selectedServiceId && data.services?.length > 0) {
          setSelectedServiceId(data.services[0].id);
        }
      })
      .catch(() => setLoadError('Failed to load provider details.'))
      .finally(() => setLoading(false));
  }, [providerId]);

  useEffect(() => {
    if (isSlotUnavailable(scheduledDate, Number(scheduledTime.split(':')[0]))) {
      const nextValid = TIME_SLOTS.find((s) => !isSlotUnavailable(scheduledDate, s.hour));
      if (nextValid) setScheduledTime(nextValid.value);
    }
  }, [scheduledDate]);

  const selectedService = useMemo(
    () => provider?.services?.find((s) => String(s.id) === String(selectedServiceId)) || provider?.services?.[0],
    [provider?.services, selectedServiceId]
  );

  const serviceCharge = Number(selectedService?.basePrice || selectedService?.startingPrice || provider?.startingPrice || 0);
  const visitFee = 0;
  const platformFee = 0;
  const totalAmount = serviceCharge + visitFee + platformFee;

  const toggleQuickIssue = (chipText) => {
    setDescription((prev) => {
      if (prev.includes(chipText)) {
        return prev
          .replace(chipText, '')
          .replace(/,\s*,/g, ',')
          .replace(/^,\s*|\s*,$/g, '')
          .trim();
      }
      return prev.trim() ? `${prev.trim()}, ${chipText}` : chipText;
    });
  };

  const handleSaveNewAddress = () => {
    if (!address.trim()) {
      showToast.error('Enter full doorstep address first.');
      return;
    }
    const item = {
      id: `addr-${Date.now()}`,
      label: newLabel,
      address: address.trim(),
      city: city.trim() || location?.city || 'Local Area',
      postalCode: postalCode.trim(),
    };
    const nextList = [item, ...savedAddresses];
    setSavedAddresses(nextList);
    setSelectedAddressId(item.id);
    setShowAddAddress(false);
    try {
      localStorage.setItem(addressStorageKey, JSON.stringify(nextList));
    } catch {}
    showToast.success(`Saved as ${newLabel} address`);
  };

  const handleNextStep = () => {
    setError('');
    if (step === 1) {
      if (!selectedServiceId && !provider?.services?.[0]?.id) {
        setError('Please select a service category.');
        return;
      }
      if (!description.trim()) {
        setError('Please describe the problem or tap a quick issue chip.');
        showToast.error('Describe the issue to help the pro prepare.');
        return;
      }
    }
    if (step === 2) {
      if (!scheduledDate || !scheduledTime) {
        setError('Please pick a date and available time slot.');
        return;
      }
      if (isSlotUnavailable(scheduledDate, Number(scheduledTime.split(':')[0]))) {
        setError('Selected time slot has already passed. Choose an upcoming slot.');
        return;
      }
    }
    if (step === 3) {
      if (!address.trim()) {
        setError('Doorstep address is required.');
        showToast.error('Please enter or select your doorstep address.');
        return;
      }
    }
    setStep((s) => Math.min(4, s + 1));
  };

  const handleSubmitBooking = async () => {
    setError('');
    if (!address?.trim()) {
      setError('Please provide your complete doorstep address.');
      showToast.error('Doorstep address is required.');
      return;
    }

    const lat = location?.lat || provider?.latitude;
    const lng = location?.lng || provider?.longitude;
    if (!lat || !lng) {
      setError('Location coordinates are required. Please allow location access.');
      showToast.error('Location is required.');
      return;
    }

    const targetServiceId = selectedServiceId || provider?.services?.[0]?.id;
    if (!targetServiceId) {
      setError('Please select a valid service category.');
      return;
    }

    setSubmitting(true);
    try {
      const bookingAmount = provider.startingPrice != null ? provider.startingPrice : 0;
      const result = await bookingService.createBooking({
        providerId: String(providerId),
        serviceId: String(targetServiceId),
        description: description.trim(),
        latitude: lat,
        longitude: lng,
        address: address.trim(),
        city: city?.trim() || 'Local Area',
        postalCode: postalCode?.trim() || '',
        scheduledDate,
        scheduledTime: scheduledTime.length === 5 ? `${scheduledTime}:00` : scheduledTime,
        estimatedDurationMins: selectedService?.defaultDurationMins || 60,
        paymentMethod: paymentMethod || 'CASH',
        amount: bookingAmount,
      });

      showToast.success('Booking confirmed!');
      setConfirmedBooking(result);
    } catch (err) {
      const msg = err.response?.data?.message || 'Booking creation failed. Please try another slot.';
      setError(msg);
      showToast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (loadError || !provider) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <ErrorState message={loadError || 'Provider not found.'} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  // Confirmation Screen
  if (confirmedBooking) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-xl mx-auto bg-brand-white border border-gray-200 rounded-sheet p-7 sm:p-10 shadow-sheet text-center space-y-6 animate-modal-pop">
          <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-status-success text-status-success flex items-center justify-center mx-auto animate-step-pulse">
            <CheckCircle2 className="w-11 h-11" strokeWidth={2.4} />
          </div>

          <div className="space-y-1.5">
            <Badge tone="accent">Booking Confirmed</Badge>
            <h1 className="font-display font-bold text-ds-24 sm:text-ds-32 text-brand-ink">
              You&apos;re all set!
            </h1>
            <p className="text-ds-14 text-gray-600">
              {provider.name} has received your request for <strong>{selectedService?.name}</strong>.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-card p-4 text-left space-y-2 text-ds-14">
            <div className="flex justify-between">
              <span className="text-gray-600">Booking ID</span>
              <span className="font-bold text-brand-ink">#{confirmedBooking.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Schedule</span>
              <span className="font-bold text-brand-ink">{scheduledDate} &bull; {scheduledTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment</span>
              <span className="font-bold text-brand-ink">
                {formatCurrency(confirmedBooking.amount ?? totalAmount)} ({paymentMethod})
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="accent"
              size="lg"
              fullWidth
              rightIcon={<ArrowRight className="w-5 h-5" strokeWidth={2.2} />}
              onClick={() => navigate(`/bookings/${confirmedBooking.id}?confirmed=true`)}
            >
              Track booking
            </Button>
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => navigate('/my-bookings')}
            >
              My Bookings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-32 lg:pb-12 space-y-6">
      <PageHeader
        title={`Book ${provider.name}`}
        subtitle={`Step ${step} of 4 • ${WIZARD_STEPS[step - 1].title}`}
        onBack={() => (step > 1 ? setStep((s) => s - 1) : navigate(-1))}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN (7-8 Cols): Stepper Form */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* 4-Step Progress Bar */}
          <div className="bg-brand-white border border-gray-200 rounded-card p-5 shadow-card">
            <div className="grid grid-cols-4 gap-3">
              {WIZARD_STEPS.map((s) => {
                const done = step > s.id;
                const active = step === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={s.id > step}
                    onClick={() => s.id < step && setStep(s.id)}
                    className={`space-y-2 text-left ${s.id < step ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div
                      className={`h-2 rounded-pill transition-colors duration-200 ${
                        done ? 'bg-status-success' : active ? 'bg-brand-yellow' : 'bg-gray-200'
                      }`}
                    />
                    <span
                      className={`block text-ds-12 font-bold truncate ${
                        active || done ? 'text-brand-ink' : 'text-gray-400'
                      }`}
                    >
                      {s.id}. {s.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div role="alert" className="p-3.5 rounded-card bg-rose-50 border border-status-danger/30 text-status-danger text-ds-12 font-semibold">
              {error}
            </div>
          )}

          {/* STEP 1: Service & Issue */}
          {step === 1 && (
            <div className="bg-brand-white border border-gray-200 rounded-card p-6 space-y-5 shadow-card">
              <div className="space-y-3">
                <h2 className="font-display font-bold text-ds-20 text-brand-ink">Choose service</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {provider.services?.map((s) => {
                    const isSelected = String(selectedServiceId) === String(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedServiceId(s.id)}
                        className={`p-4 rounded-card border text-left transition-all duration-150 flex items-center justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-brand-yellowSoft border-brand-yellow text-brand-ink shadow-card'
                            : 'bg-brand-white border-gray-200 hover:border-brand-ink'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-display font-bold text-ds-14 text-brand-ink truncate">
                            {s.name}
                          </div>
                          <div className="text-ds-12 text-gray-600 inline-flex items-center gap-1 mt-0.5">
                            <Clock className="w-3.5 h-3.5" /> {s.defaultDurationMins || 60} mins
                          </div>
                        </div>
                        {isSelected && (
                          <span className="w-6 h-6 rounded-full bg-brand-ink text-brand-yellow flex items-center justify-center shrink-0">
                            <Check className="w-4 h-4" strokeWidth={2.5} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2.5">
                <h3 className="font-display font-bold text-ds-16 text-brand-ink">Quick issue tags</h3>
                <div className="flex flex-wrap gap-2">
                  {QUICK_ISSUE_CHIPS.map((issue) => (
                    <Chip
                      key={issue}
                      selected={description.includes(issue)}
                      tone="yellow"
                      onClick={() => toggleQuickIssue(issue)}
                    >
                      {issue}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="booking-desc" className="block text-ds-12 font-semibold text-gray-900">
                  Describe the problem or special instructions <span className="text-status-danger">*</span>
                </label>
                <textarea
                  id="booking-desc"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Split AC is not cooling and water drips from indoor unit..."
                  className="w-full p-3.5 rounded-input border border-gray-200 focus:border-brand-ink focus:ring-2 focus:ring-brand-ink/10 outline-none text-ds-14 text-brand-ink bg-brand-white"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Date & Slot */}
          {step === 2 && (
            <div className="bg-brand-white border border-gray-200 rounded-card p-6 space-y-6 shadow-card">
              <div className="space-y-3">
                <h2 className="font-display font-bold text-ds-20 text-brand-ink">Pick a date</h2>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
                  {dates.map((d) => {
                    const active = scheduledDate === d.iso;
                    return (
                      <button
                        key={d.iso}
                        type="button"
                        onClick={() => setScheduledDate(d.iso)}
                        className={`min-h-[82px] px-2 py-2.5 rounded-card border flex flex-col items-center justify-center gap-0.5 transition-all duration-150 cursor-pointer ${
                          active
                            ? 'bg-brand-ink text-brand-white border-brand-ink shadow-card'
                            : 'bg-brand-white text-brand-ink border-gray-200 hover:border-brand-ink'
                        }`}
                      >
                        <span className={`text-[11px] font-bold uppercase ${active ? 'text-brand-yellow' : 'text-gray-600'}`}>
                          {d.dayShort}
                        </span>
                        <span className="font-display font-extrabold text-ds-20">{d.dayNum}</span>
                        <span className={`text-[11px] ${active ? 'text-gray-200' : 'text-gray-400'}`}>{d.month}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-display font-bold text-ds-16 text-brand-ink">Available time slots</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                  {TIME_SLOTS.map((slot) => {
                    const disabled = isSlotUnavailable(scheduledDate, slot.hour);
                    const selected = scheduledTime === slot.value && !disabled;
                    return (
                      <button
                        key={slot.value}
                        type="button"
                        disabled={disabled}
                        onClick={() => setScheduledTime(slot.value)}
                        className={`min-h-[48px] px-3 py-2.5 rounded-card border font-display font-bold text-ds-14 transition-all duration-150 ${
                          disabled
                            ? 'bg-gray-100 text-gray-400 border-gray-200 line-through cursor-not-allowed'
                            : selected
                              ? 'bg-brand-yellow text-brand-ink border-brand-yellow shadow-card cursor-pointer'
                              : 'bg-brand-white text-brand-ink border-gray-200 hover:border-brand-ink cursor-pointer'
                        }`}
                      >
                        {slot.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Address */}
          {step === 3 && (
            <div className="bg-brand-white border border-gray-200 rounded-card p-6 space-y-5 shadow-card">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display font-bold text-ds-20 text-brand-ink">Service address</h2>
                <button
                  type="button"
                  onClick={() => setShowAddAddress((p) => !p)}
                  className="inline-flex items-center gap-1.5 text-ds-12 font-bold text-brand-ink px-3 py-1.5 rounded-pill bg-brand-yellowSoft border border-brand-yellow cursor-pointer"
                >
                  <Plus className="w-4 h-4" strokeWidth={2.2} />
                  {showAddAddress ? 'Hide Form' : 'Add New'}
                </button>
              </div>

              <div className="h-48 rounded-card overflow-hidden border border-gray-200 relative">
                <ProviderMap customerLocation={location} providers={[provider]} />
                <div className="absolute bottom-2 left-2 z-10 px-3 py-1 rounded-pill bg-brand-ink/90 text-brand-white text-[11px] font-semibold">
                  Pin: {location?.city || 'Selected area'}
                </div>
              </div>

              {savedAddresses.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-ds-12 font-bold uppercase tracking-wider text-gray-600 block">
                    Saved addresses
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {savedAddresses.map((saved) => {
                      const isSelected = selectedAddressId === saved.id && !showAddAddress;
                      return (
                        <button
                          key={saved.id}
                          type="button"
                          onClick={() => {
                            setSelectedAddressId(saved.id);
                            setAddress(saved.address);
                            setCity(saved.city || location?.city || '');
                            setPostalCode(saved.postalCode || '');
                            setShowAddAddress(false);
                          }}
                          className={`p-3.5 rounded-card border text-left flex items-start justify-between gap-3 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-brand-yellowSoft border-brand-yellow shadow-card'
                              : 'bg-brand-white border-gray-200 hover:border-brand-ink'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="w-9 h-9 rounded-card bg-brand-ink text-brand-yellow flex items-center justify-center shrink-0">
                              {saved.label === 'Work' ? <Briefcase className="w-4 h-4" /> : <Home className="w-4 h-4" />}
                            </span>
                            <div>
                              <div className="font-display font-bold text-ds-14 text-brand-ink">{saved.label}</div>
                              <div className="text-ds-12 text-gray-600 mt-0.5">{saved.address}</div>
                            </div>
                          </div>
                          {isSelected && <Check className="w-5 h-5 text-brand-ink shrink-0" strokeWidth={2.5} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {(showAddAddress || savedAddresses.length === 0) && (
                <div className="space-y-3 p-4 rounded-card bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-2">
                    {['Home', 'Work', 'Other'].map((lbl) => (
                      <Chip
                        key={lbl}
                        selected={newLabel === lbl}
                        tone="ink"
                        onClick={() => setNewLabel(lbl)}
                      >
                        {lbl}
                      </Chip>
                    ))}
                  </div>

                  <Input
                    label="Complete Doorstep Address"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Flat/Door No, Building, Street, Landmark..."
                    leftIcon={<MapPin className="w-5 h-5" strokeWidth={2} />}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="City / Area"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City name"
                    />
                    <Input
                      label="Postal Code (Optional)"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="e.g. 560001"
                    />
                  </div>

                  <Button
                    variant="secondary"
                    onClick={handleSaveNewAddress}
                    leftIcon={<Plus className="w-4 h-4" strokeWidth={2} />}
                  >
                    Save Address for Future
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Payment */}
          {step === 4 && (
            <div className="bg-brand-white border border-gray-200 rounded-card p-6 space-y-4 shadow-card">
              <h2 className="font-display font-bold text-ds-20 text-brand-ink">Select payment method</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    key: 'CASH',
                    title: 'Cash After Service',
                    desc: 'Pay cash once job finishes',
                    icon: Wallet,
                  },
                  {
                    key: 'UPI',
                    title: 'UPI Transfer',
                    desc: 'GPay / PhonePe / Paytm QR at door',
                    icon: Smartphone,
                  },
                ].map((method) => {
                  const Icon = method.icon;
                  const active = paymentMethod === method.key;
                  return (
                    <button
                      key={method.key}
                      type="button"
                      onClick={() => setPaymentMethod(method.key)}
                      className={`p-4 rounded-card border text-left transition-all duration-150 flex items-start gap-3 cursor-pointer ${
                        active
                          ? 'bg-brand-yellowSoft border-brand-yellow shadow-card'
                          : 'bg-brand-white border-gray-200 hover:border-brand-ink'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-card flex items-center justify-center shrink-0 ${
                          active ? 'bg-brand-ink text-brand-yellow' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <Icon className="w-5 h-5" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-display font-bold text-ds-14 text-brand-ink">{method.title}</div>
                        <div className="text-ds-12 text-gray-600 mt-0.5">{method.desc}</div>
                      </div>
                      {active && <Check className="w-5 h-5 text-brand-ink shrink-0" strokeWidth={2.5} />}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 text-ds-12 text-gray-600 pt-1">
                <ShieldCheck className="w-4 h-4 text-status-success shrink-0" />
                <span>Protected by 4-digit Start OTP arrival verification.</span>
              </div>
            </div>
          )}

          {/* Desktop Action Buttons */}
          <div className="hidden lg:flex items-center justify-between gap-4 pt-1">
            {step > 1 ? (
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setStep((s) => s - 1)}
                leftIcon={<ArrowLeft className="w-4 h-4" strokeWidth={2} />}
              >
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button
                variant="accent"
                size="lg"
                rightIcon={<ArrowRight className="w-5 h-5" strokeWidth={2.2} />}
                onClick={handleNextStep}
                className="min-w-[200px]"
              >
                Continue
              </Button>
            ) : (
              <Button
                variant="accent"
                size="lg"
                loading={submitting}
                rightIcon={<ArrowRight className="w-5 h-5" strokeWidth={2.2} />}
                onClick={handleSubmitBooking}
                className="min-w-[240px]"
              >
                Confirm Booking &bull; {formatCurrency(totalAmount)}
              </Button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (4-5 Cols, Sticky): Live Booking Summary Card */}
        <aside className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24">
          <div className="bg-brand-white border border-gray-200 rounded-sheet p-6 shadow-sheet space-y-5">
            <div className="flex items-center gap-3.5 border-b border-gray-100 pb-4">
              <Avatar
                src={getProviderAvatar(provider.name)}
                name={provider.name}
                size="md"
                status={provider.available ? 'online' : 'offline'}
                verified={provider.verificationStatus === 'VERIFIED'}
              />
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                  Booking Summary
                </span>
                <h3 className="font-display font-bold text-ds-16 text-brand-ink truncate">
                  {provider.name}
                </h3>
              </div>
            </div>

            <div className="space-y-3 text-ds-12 bg-gray-50 rounded-card p-4 border border-gray-100">
              <div className="flex justify-between gap-2">
                <span className="text-gray-600">Service</span>
                <span className="font-bold text-brand-ink text-right">{selectedService?.name || 'Select service'}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-600">Schedule</span>
                <span className="font-bold text-brand-ink text-right">{scheduledDate} at {scheduledTime}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-600">Address</span>
                <span className="font-semibold text-brand-ink text-right truncate max-w-[200px]">
                  {address || 'Pending step 3'}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-600">Payment</span>
                <span className="font-bold text-brand-ink">{paymentMethod}</span>
              </div>
            </div>

            <div className="space-y-2.5 text-ds-14 pt-1">
              <div className="flex items-center justify-between text-gray-600">
                <span>Service charge</span>
                <span className="font-semibold text-brand-ink">{formatCurrency(serviceCharge)}</span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>Visit fee</span>
                <span className="font-semibold text-status-success">Free (₹0)</span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>Platform fee</span>
                <span className="font-semibold text-status-success">Free (₹0)</span>
              </div>
              <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                <span className="font-display font-bold text-ds-16 text-brand-ink">Total payable</span>
                <span className="font-display font-extrabold text-ds-24 text-brand-ink">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Sticky Bottom Wizard CTA Bar (< lg) */}
      <div className="lg:hidden fixed bottom-16 lg:bottom-0 left-0 right-0 z-30 bg-brand-white/95 backdrop-blur-md border-t border-gray-200 shadow-sheet px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          {step > 1 && (
            <Button
              variant="secondary"
              onClick={() => setStep((s) => s - 1)}
              leftIcon={<ArrowLeft className="w-4 h-4" strokeWidth={2} />}
            >
              Back
            </Button>
          )}

          {step < 4 ? (
            <Button
              variant="accent"
              size="lg"
              fullWidth
              rightIcon={<ArrowRight className="w-5 h-5" strokeWidth={2.2} />}
              onClick={handleNextStep}
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="accent"
              size="lg"
              fullWidth
              loading={submitting}
              rightIcon={<ArrowRight className="w-5 h-5" strokeWidth={2.2} />}
              onClick={handleSubmitBooking}
            >
              Confirm &bull; {formatCurrency(totalAmount)}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
