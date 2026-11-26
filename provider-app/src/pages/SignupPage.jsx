import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  Navigation,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Check,
} from 'lucide-react';
import api from '../api/axios';
import { AuthSplitLayout } from '../components/auth/AuthSplitLayout';
import { ProviderMap } from '../components/map/ProviderMap';
import { Button, Chip, Input, PasswordInput, showToast } from '../components/ui';

const getPasswordStrength = (pwd) => {
  if (!pwd) return { score: 0, label: '', barClass: 'bg-gray-200', width: '0%' };
  let score = 0;
  if (pwd.length >= 6) score += 1;
  if (pwd.length >= 8) score += 1;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
  if (/\d/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 1;
  if (score <= 1) return { score: 1, label: 'Weak', barClass: 'bg-status-danger', width: '25%' };
  if (score === 2) return { score: 2, label: 'Fair', barClass: 'bg-status-warning', width: '50%' };
  if (score === 3) return { score: 3, label: 'Good', barClass: 'bg-status-info', width: '75%' };
  return { score: 4, label: 'Strong', barClass: 'bg-status-success', width: '100%' };
};

export const SignupPage = () => {
  const [step, setStep] = useState(1);

  // Step 1: Account
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2: Service Details
  const [categories, setCategories] = useState([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [primaryServiceId, setPrimaryServiceId] = useState('');
  const [description, setDescription] = useState('');
  const [experienceYears, setExperienceYears] = useState(3);
  const [startingPrice, setStartingPrice] = useState(299);
  const [serviceRadiusKm, setServiceRadiusKm] = useState(15);

  // Step 3: Location
  const [serviceArea, setServiceArea] = useState('Central City Region');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [latitude, setLatitude] = useState(12.9716);
  const [longitude, setLongitude] = useState(77.5946);
  const [detectingGps, setDetectingGps] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  const navigate = useNavigate();
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const t = setInterval(() => setCooldownLeft((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldownLeft]);

  useEffect(() => {
    api.get('/services')
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setCategories(res.data.data);
          const firstId = res.data.data[0].id;
          setPrimaryServiceId(firstId);
          setSelectedServiceIds([firstId]);
        }
      })
      .catch(() => {});
  }, []);

  const toggleCategory = (id) => {
    setSelectedServiceIds((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((item) => item !== id);
        if (primaryServiceId === id) {
          setPrimaryServiceId(next[0] || '');
        }
        return next;
      }
      if (!primaryServiceId) setPrimaryServiceId(id);
      return [...prev, id];
    });
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      showToast.error('Geolocation is not supported on this device');
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Number(pos.coords.latitude.toFixed(6)));
        setLongitude(Number(pos.coords.longitude.toFixed(6)));
        setDetectingGps(false);
        showToast.success('Base location detected from GPS');
      },
      (err) => {
        setDetectingGps(false);
        showToast.error('Could not detect GPS: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const validateAndNext = () => {
    setError('');
    if (step === 1) {
      if (name.trim().length < 2) {
        setError('Enter your name or business name.');
        return;
      }
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError('Enter a valid email address.');
        return;
      }
      if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
        setError('Enter a valid 10-digit mobile number.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (categories.length > 0 && selectedServiceIds.length === 0) {
        setError('Select at least one service category.');
        return;
      }
      if (!description.trim()) {
        setError('Add a short summary of your skills and experience.');
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!serviceArea.trim()) {
      setError('Enter your service area name.');
      return;
    }

    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const resolvedPrimary = primaryServiceId || selectedServiceIds[0] || categories[0]?.id || 'electrician';

    const pendingRegistration = {
      role: 'PROVIDER',
      payload: {
        name: name.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        password,
        description: description.trim(),
        experienceYears: Number(experienceYears) || 1,
        address: address.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        latitude: Number(latitude),
        longitude: Number(longitude),
        serviceArea: serviceArea.trim(),
        serviceRadiusKm: Number(serviceRadiusKm) || 15,
        primaryServiceId: String(resolvedPrimary),
        serviceIds: selectedServiceIds.map(String),
        startingPrice: Number(startingPrice) || 299,
      },
    };

    try {
      await api.post('/auth/send-otp', {
        email: cleanEmail,
        purpose: 'EMAIL_VERIFICATION',
      });
      sessionStorage.setItem('localgo_pending_registration', JSON.stringify(pendingRegistration));
      showToast.success('Verification code sent to your email!');
      navigate(`/verify-email?email=${encodeURIComponent(cleanEmail)}`, {
        state: { pendingRegistration },
      });
    } catch (err) {
      if (err.response?.status === 429) {
        const retrySec = err.response?.data?.data?.retryAfterSeconds || Number(err.response?.headers?.['retry-after']) || 60;
        setCooldownLeft(retrySec);
      }
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Could not send verification OTP. Please try again.';
      setError(msg);
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout badgeText="Partner Registration" wideForm>
      <div className="bg-brand-white dark:bg-gray-900 rounded-sheet border border-gray-200 dark:border-gray-600/30 shadow-sheet p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="font-display font-bold text-ds-24 text-brand-ink dark:text-brand-white tracking-tight">
            {step === 1 ? 'Create partner account' : step === 2 ? 'Service details' : 'Base location & radius'}
          </h2>
          <p className="text-ds-12 text-gray-600 dark:text-gray-400 mt-0.5">
            {step === 1
              ? 'Enter your contact and login details'
              : step === 2
                ? 'Select your categories, experience, and coverage'
                : 'Tap map or detect GPS to set your dispatch pin'}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3.5 bg-rose-50 dark:bg-rose-500/10 border border-status-danger/30 text-status-danger text-ds-12 rounded-card font-semibold flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* STEP 1: ACCOUNT (2-col on desktop) */}
          {step === 1 && (
            <>
              <Input
                label="Full Name / Business Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rajesh Electric Works"
                leftIcon={<User className="w-5 h-5" strokeWidth={2} />}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Email Address"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="partner@example.com"
                  leftIcon={<Mail className="w-5 h-5" strokeWidth={2} />}
                />

                <Input
                  label="Phone Number"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  leftIcon={<Phone className="w-5 h-5" strokeWidth={2} />}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div className="space-y-2">
                  <PasswordInput
                    label="Password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                  />
                  {password.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-gray-400">Strength</span>
                        <span className="text-brand-ink dark:text-brand-white">{strength.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-200 dark:bg-brand-ink rounded-pill overflow-hidden">
                        <div
                          className={`h-full rounded-pill transition-all ${strength.barClass}`}
                          style={{ width: strength.width }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <PasswordInput
                  label="Confirm Password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                />
              </div>

              <Button
                variant="accent"
                size="lg"
                fullWidth
                rightIcon={<ArrowRight className="w-5 h-5" strokeWidth={2.2} />}
                onClick={validateAndNext}
              >
                Next: Service Details
              </Button>
            </>
          )}

          {/* STEP 2: SERVICE DETAILS */}
          {step === 2 && (
            <>
              <div className="space-y-2">
                <label className="block text-ds-12 font-bold text-gray-900 dark:text-gray-200">
                  Select Service Categories
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const selected = selectedServiceIds.includes(cat.id);
                    return (
                      <Chip
                        key={cat.id}
                        selected={selected}
                        tone="yellow"
                        leftIcon={selected ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : null}
                        onClick={() => toggleCategory(cat.id)}
                      >
                        {cat.name}
                      </Chip>
                    );
                  })}
                  {categories.length === 0 && (
                    <Chip selected tone="yellow">General Home Service</Chip>
                  )}
                </div>
                {selectedServiceIds.length > 1 && (
                  <p className="text-[11px] text-gray-600 dark:text-gray-400">
                    Primary category: <strong>{categories.find((c) => c.id === primaryServiceId)?.name}</strong>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Experience (Years)"
                  type="number"
                  min="0"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  leftIcon={<Briefcase className="w-4 h-4" strokeWidth={2} />}
                />
                <Input
                  label="Starting Rate (₹)"
                  type="number"
                  min="50"
                  value={startingPrice}
                  onChange={(e) => setStartingPrice(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-ds-12 font-bold">
                  <span className="text-gray-900 dark:text-gray-200">Coverage Radius</span>
                  <span className="text-brand-ink dark:text-brand-yellow">{serviceRadiusKm} km</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="50"
                  step="1"
                  value={serviceRadiusKm}
                  onChange={(e) => setServiceRadiusKm(Number(e.target.value))}
                  className="w-full accent-brand-yellow cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="partner-bio" className="block text-ds-12 font-bold text-gray-900 dark:text-gray-200">
                  Experience &amp; Skills Summary <span className="text-status-danger">*</span>
                </label>
                <textarea
                  id="partner-bio"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your certifications, tools, and specialties..."
                  className="w-full p-3.5 rounded-input border border-gray-200 dark:border-gray-600/50 bg-brand-white dark:bg-brand-ink text-brand-ink dark:text-brand-white text-ds-14 outline-none focus:border-brand-yellow"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <Button
                  variant="secondary"
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button
                  variant="accent"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                  onClick={validateAndNext}
                >
                  Next: Location
                </Button>
              </div>
            </>
          )}

          {/* STEP 3: LOCATION */}
          {step === 3 && (
            <>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-ds-12 font-bold text-gray-900 dark:text-gray-200">
                    Tap map or drag pin ({serviceRadiusKm} km zone)
                  </span>
                  <Button
                    variant="secondary"
                    loading={detectingGps}
                    leftIcon={<Navigation className="w-4 h-4 text-brand-yellow" />}
                    onClick={handleDetectLocation}
                    className="min-h-[42px] py-1.5 px-3 text-ds-12"
                  >
                    Detect GPS
                  </Button>
                </div>

                <div className="h-52">
                  <ProviderMap
                    center={{ lat: latitude, lng: longitude }}
                    radiusKm={serviceRadiusKm}
                    interactive={true}
                    onPickLocation={({ lat, lng }) => {
                      setLatitude(lat);
                      setLongitude(lng);
                    }}
                  />
                </div>
                <p className="text-[11px] font-mono text-gray-400">
                  Pin: {Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Primary Service Area Name"
                  required
                  value={serviceArea}
                  onChange={(e) => setServiceArea(e.target.value)}
                  placeholder="e.g. Indiranagar / Madanapalle Town"
                  leftIcon={<MapPin className="w-5 h-5" strokeWidth={2} />}
                />
                <Input
                  label="Street Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Shop / Street / Landmark"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                />
                <Input
                  label="Postal Code"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="PIN code"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <Button
                  variant="secondary"
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                  onClick={() => setStep(2)}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="accent"
                  loading={loading}
                  disabled={cooldownLeft > 0}
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  {cooldownLeft > 0 ? `Wait ${cooldownLeft}s` : 'Verify & Submit'}
                </Button>
              </div>
            </>
          )}
        </form>

        <div className="text-center text-ds-14 text-gray-600 dark:text-gray-400 pt-4 border-t border-gray-100 dark:border-gray-600/20">
          Already registered?{' '}
          <Link to="/login" className="text-brand-ink dark:text-brand-yellow font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </AuthSplitLayout>
  );
};
