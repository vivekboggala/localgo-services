import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Star,
  Navigation,
  Clock,
  FileCheck,
  Upload,
  Sun,
  Moon,
  LogOut,
  Wrench,
  Briefcase,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { providerPortalService } from '../../services/providerPortalService';
import { ProviderMap } from '../../components/map/ProviderMap';
import ChangePasswordCard from '../../components/auth/ChangePasswordCard';
import {
  Avatar,
  Badge,
  Button,
  ConfirmDialog,
  ErrorState,
  Input,
  PageHeader,
  RatingStars,
  SkeletonCard,
  Toggle,
  showToast,
} from '../../components/ui';

const DEFAULT_HOURS = {
  enabled: true,
  start: '08:00',
  end: '20:00',
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const ProviderProfile = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [description, setDescription] = useState('');
  const [experienceYears, setExperienceYears] = useState(3);
  const [startingPrice, setStartingPrice] = useState(299);
  const [servicesList, setServicesList] = useState([]);
  const [serviceArea, setServiceArea] = useState('');
  const [serviceRadiusKm, setServiceRadiusKm] = useState(15);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [latitude, setLatitude] = useState(12.9716);
  const [longitude, setLongitude] = useState(77.5946);

  const [workingHours, setWorkingHours] = useState(() => {
    try {
      const saved = localStorage.getItem(`localgo_provider_hours_${user?.id || 'me'}`);
      return saved ? JSON.parse(saved) : DEFAULT_HOURS;
    } catch {
      return DEFAULT_HOURS;
    }
  });

  const [docsState, setDocsState] = useState(() => {
    try {
      const saved = localStorage.getItem(`localgo_provider_docs_${user?.id || 'me'}`);
      return saved
        ? JSON.parse(saved)
        : [
            { key: 'id', title: 'Government Photo ID', subtitle: 'Aadhaar / Driving License / PAN', status: 'VERIFIED' },
            { key: 'cert', title: 'Trade & Skill Certificate', subtitle: 'Technical training or license', status: 'UPLOADED' },
            { key: 'bank', title: 'UPI / Bank Verification', subtitle: 'Payout settlement account', status: 'PENDING' },
          ];
    } catch {
      return [
        { key: 'id', title: 'Government Photo ID', subtitle: 'Aadhaar / Driving License / PAN', status: 'VERIFIED' },
        { key: 'cert', title: 'Trade & Skill Certificate', subtitle: 'Technical training or license', status: 'UPLOADED' },
        { key: 'bank', title: 'UPI / Bank Verification', subtitle: 'Payout settlement account', status: 'PENDING' },
      ];
    }
  });

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const loadProfile = () => {
    setLoading(true);
    setLoadError('');
    providerPortalService.getProfile()
      .then((data) => {
        if (!data) return;
        setProfile(data);
        if (data.description) setDescription(data.description);
        if (data.experienceYears != null) setExperienceYears(data.experienceYears);
        if (data.startingPrice != null) setStartingPrice(data.startingPrice);
        if (data.serviceRadiusKm) setServiceRadiusKm(data.serviceRadiusKm);
        if (data.serviceArea) setServiceArea(data.serviceArea);
        if (data.address) setAddress(data.address);
        if (data.city) setCity(data.city);
        if (data.postalCode) setPostalCode(data.postalCode);
        if (data.latitude != null) setLatitude(data.latitude);
        if (data.longitude != null) setLongitude(data.longitude);
        if (Array.isArray(data.services)) {
          setServicesList(
            data.services.map((s) => ({
              ...s,
              customPrice: s.basePrice || data.startingPrice || 299,
            }))
          );
        }
      })
      .catch((err) => {
        console.error('Failed to load profile:', err);
        setLoadError(err.response?.data?.message || 'Unable to load provider profile.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      showToast.error('Geolocation is not supported on this device');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Number(pos.coords.latitude.toFixed(6)));
        setLongitude(Number(pos.coords.longitude.toFixed(6)));
        showToast.success('Base location updated from GPS');
      },
      (err) => {
        showToast.error('Unable to retrieve location: ' + err.message);
      }
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const resolvedStartingPrice =
        servicesList.length > 0
          ? Number(servicesList[0].customPrice) || Number(startingPrice) || 299
          : Number(startingPrice) || 299;

      const payload = {
        description: description.trim(),
        experienceYears: Number(experienceYears) || 0,
        startingPrice: resolvedStartingPrice,
        serviceArea: serviceArea.trim() || 'Service Area',
        serviceRadiusKm: Number(serviceRadiusKm) || 15,
        address: address.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
      };
      if (latitude !== '' && !isNaN(Number(latitude))) {
        payload.latitude = Number(latitude);
      }
      if (longitude !== '' && !isNaN(Number(longitude))) {
        payload.longitude = Number(longitude);
      }

      const updated = await providerPortalService.updateProfile(payload);
      if (updated) setProfile(updated);
      try {
        localStorage.setItem(`localgo_provider_hours_${user?.id || 'me'}`, JSON.stringify(workingHours));
      } catch {}
      showToast.success('Partner settings & pricing saved!');
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day) => {
    setWorkingHours((prev) => {
      const exists = prev.days.includes(day);
      const nextDays = exists ? prev.days.filter((d) => d !== day) : [...prev.days, day];
      const next = { ...prev, days: nextDays };
      try {
        localStorage.setItem(`localgo_provider_hours_${user?.id || 'me'}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleUploadDoc = (docKey) => {
    const nextDocs = docsState.map((d) => (d.key === docKey ? { ...d, status: 'UPLOADED' } : d));
    setDocsState(nextDocs);
    try {
      localStorage.setItem(`localgo_provider_docs_${user?.id || 'me'}`, JSON.stringify(nextDocs));
    } catch {}
    showToast.success('Document marked for review');
  };

  const handleConfirmLogout = async () => {
    await logout();
    setLogoutOpen(false);
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <PageHeader
        title="Partner Profile"
        subtitle="Manage services, pricing, radius coverage, and preferences"
      />

      {loadError && <ErrorState compact message={loadError} onRetry={loadProfile} />}

      {/* 1. Profile Header with Verified Badge & Rating */}
      <div className="bg-gray-900 dark:bg-gray-900 text-brand-white rounded-sheet p-5 sm:p-6 border border-gray-600/30 shadow-sheet bg-dark-grid-pattern flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Avatar
            name={profile?.name || user?.name || user?.email}
            size="xl"
            tone="yellow"
            verified={profile?.verificationStatus === 'VERIFIED'}
          />
          <div className="min-w-0 space-y-1">
            <h2 className="font-display font-bold text-ds-20 text-brand-white truncate">
              {profile?.name || user?.name || 'Partner'}
            </h2>
            <p className="text-ds-12 text-gray-400 truncate">{user?.email}</p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge tone={profile?.verificationStatus === 'VERIFIED' ? 'success' : 'warning'} dot>
                {profile?.verificationStatus || 'PENDING'}
              </Badge>
              <span className="inline-flex items-center gap-1.5 text-ds-12 font-bold text-brand-yellow">
                <Star className="w-4 h-4 fill-brand-yellow" />
                {profile?.rating > 0 ? Number(profile.rating).toFixed(1) : 'New'}
                <span className="text-gray-400 font-normal">({profile?.completedJobs ?? 0} jobs)</span>
              </span>
            </div>
          </div>
        </div>

        <RatingStars rating={profile?.rating || 5} size="sm" />
      </div>

      {/* 2. Theme Toggle Card (Dark Outdoors Default / Light Mode) */}
      <div className="bg-brand-white dark:bg-gray-900 rounded-card border border-gray-200 dark:border-gray-600/30 p-5 shadow-card">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-card bg-brand-yellowSoft dark:bg-brand-yellow/15 border border-brand-yellow text-brand-ink dark:text-brand-yellow flex items-center justify-center shrink-0">
            {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </div>
          <div className="flex-1">
            <Toggle
              checked={isDark}
              onChange={() => {
                toggleTheme();
                showToast.success(`Switched to ${isDark ? 'Light' : 'Dark'} mode`);
              }}
              tone="yellow"
              label="Dark Theme (Recommended Outdoors)"
              description={isDark ? 'High-contrast dark #0B0B0F theme active' : 'Light #F7F7F8 theme active'}
            />
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 3. Personal Info */}
        <section className="bg-brand-white dark:bg-gray-900 rounded-card border border-gray-200 dark:border-gray-600/30 p-5 sm:p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-600/20">
            <Briefcase className="w-5 h-5 text-brand-yellow" />
            <h3 className="font-display font-bold text-ds-16 text-brand-ink dark:text-brand-white">
              Personal &amp; Business Info
            </h3>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="prof-desc" className="block text-ds-12 font-bold text-gray-900 dark:text-gray-200">
              Business Description
            </label>
            <textarea
              id="prof-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your specialties and certifications..."
              className="w-full p-3.5 rounded-input border border-gray-200 dark:border-gray-600/40 bg-brand-white dark:bg-brand-ink text-brand-ink dark:text-brand-white text-ds-14 outline-none focus:border-brand-yellow"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Experience (Years)"
              type="number"
              min="0"
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
            />
            <Input
              label="Service Area Name"
              value={serviceArea}
              onChange={(e) => setServiceArea(e.target.value)}
              placeholder="e.g. Indiranagar"
            />
          </div>

          <Input
            label="Base Street Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Door No, Street, Landmark"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
            <Input label="Postal Code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="PIN" />
          </div>
        </section>

        {/* 4. Services & Pricing Editable Rows */}
        <section className="bg-brand-white dark:bg-gray-900 rounded-card border border-gray-200 dark:border-gray-600/30 p-5 sm:p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-600/20">
            <Wrench className="w-5 h-5 text-brand-yellow" />
            <h3 className="font-display font-bold text-ds-16 text-brand-ink dark:text-brand-white">
              Services &amp; Pricing
            </h3>
          </div>

          {servicesList.length > 0 ? (
            <div className="space-y-3">
              {servicesList.map((svc, idx) => (
                <div
                  key={svc.id}
                  className="bg-gray-50 dark:bg-brand-ink rounded-card p-3.5 border border-gray-200 dark:border-gray-600/30 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-display font-bold text-ds-14 text-brand-ink dark:text-brand-white truncate">
                      {svc.name}
                    </div>
                    <div className="text-ds-12 text-gray-600 dark:text-gray-400">
                      Est. {svc.defaultDurationMins || 60} mins
                    </div>
                  </div>
                  <div className="w-32 shrink-0">
                    <Input
                      type="number"
                      min="50"
                      aria-label={`${svc.name} starting price`}
                      value={svc.customPrice}
                      onChange={(e) => {
                        const val = e.target.value;
                        setServicesList((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, customPrice: val } : item))
                        );
                        if (idx === 0) setStartingPrice(val);
                      }}
                      leftIcon={<span className="text-ds-12 font-bold">₹</span>}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Input
              label="Base Starting Rate (₹)"
              type="number"
              min="50"
              value={startingPrice}
              onChange={(e) => setStartingPrice(e.target.value)}
            />
          )}
        </section>

        {/* 5. Coverage Radius Slider with Map Circle Preview */}
        <section className="bg-brand-white dark:bg-gray-900 rounded-card border border-gray-200 dark:border-gray-600/30 p-5 sm:p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-100 dark:border-gray-600/20">
            <h3 className="font-display font-bold text-ds-16 text-brand-ink dark:text-brand-white">
              Coverage Radius &amp; Base Pin
            </h3>
            <Button
              variant="secondary"
              onClick={handleDetectLocation}
              leftIcon={<Navigation className="w-4 h-4 text-brand-yellow" />}
              className="min-h-[42px] py-1.5 px-3 text-ds-12"
            >
              Detect GPS
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-ds-14 font-bold">
              <span className="text-gray-600 dark:text-gray-200">Dispatch Radius</span>
              <span className="font-display font-extrabold text-brand-ink dark:text-brand-yellow">
                {serviceRadiusKm} km
              </span>
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

          <div className="h-56">
            <ProviderMap
              center={{ lat: latitude, lng: longitude }}
              radiusKm={serviceRadiusKm}
              interactive={true}
              zoom={11}
              onPickLocation={({ lat, lng }) => {
                setLatitude(lat);
                setLongitude(lng);
              }}
            />
          </div>
          <p className="text-[11px] font-mono text-gray-400">
            Coordinates: {Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)} (tap map or drag pin)
          </p>
        </section>

        {/* 6. Working Hours */}
        <section className="bg-brand-white dark:bg-gray-900 rounded-card border border-gray-200 dark:border-gray-600/30 p-5 sm:p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-600/20">
            <Clock className="w-5 h-5 text-brand-yellow" />
            <h3 className="font-display font-bold text-ds-16 text-brand-ink dark:text-brand-white">
              Working Hours
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {ALL_DAYS.map((day) => {
              const active = workingHours.days.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`min-h-[42px] px-3.5 rounded-pill text-ds-12 font-bold border transition-colors ${
                    active
                      ? 'bg-brand-yellow text-brand-ink border-brand-yellow'
                      : 'bg-gray-50 dark:bg-brand-ink text-gray-400 border-gray-200 dark:border-gray-600/30'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Shift Start"
              type="time"
              value={workingHours.start}
              onChange={(e) => setWorkingHours((p) => ({ ...p, start: e.target.value }))}
            />
            <Input
              label="Shift End"
              type="time"
              value={workingHours.end}
              onChange={(e) => setWorkingHours((p) => ({ ...p, end: e.target.value }))}
            />
          </div>
        </section>

        <Button type="submit" variant="accent" size="lg" fullWidth loading={saving}>
          {saving ? 'Saving Changes...' : 'Save Profile & Settings'}
        </Button>
      </form>

      {/* 7. Documents Upload Placeholder List */}
      <section className="bg-brand-white dark:bg-gray-900 rounded-card border border-gray-200 dark:border-gray-600/30 p-5 sm:p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-600/20">
          <FileCheck className="w-5 h-5 text-brand-yellow" />
          <h3 className="font-display font-bold text-ds-16 text-brand-ink dark:text-brand-white">
            Verification Documents
          </h3>
        </div>

        <div className="space-y-3">
          {docsState.map((docItem) => (
            <div
              key={docItem.key}
              className="bg-gray-50 dark:bg-brand-ink rounded-card p-3.5 border border-gray-200 dark:border-gray-600/30 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="font-display font-bold text-ds-14 text-brand-ink dark:text-brand-white truncate">
                  {docItem.title}
                </div>
                <div className="text-ds-12 text-gray-600 dark:text-gray-400 truncate">{docItem.subtitle}</div>
              </div>

              {docItem.status === 'VERIFIED' ? (
                <Badge tone="success" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                  Verified
                </Badge>
              ) : docItem.status === 'UPLOADED' ? (
                <Button
                  variant="secondary"
                  onClick={() => handleUploadDoc(docItem.key)}
                  className="min-h-[42px] py-1.5 px-3 text-ds-12 shrink-0"
                >
                  Re-upload
                </Button>
              ) : (
                <Button
                  variant="accent"
                  onClick={() => handleUploadDoc(docItem.key)}
                  leftIcon={<Upload className="w-4 h-4" />}
                  className="min-h-[42px] py-1.5 px-3 text-ds-12 shrink-0"
                >
                  Upload
                </Button>
              )}
            </div>
          ))}
        </div>
      </section>

      <ChangePasswordCard />

      {/* 8. Logout */}
      <Button
        variant="danger"
        size="lg"
        fullWidth
        leftIcon={<LogOut className="w-5 h-5" />}
        onClick={() => setLogoutOpen(true)}
      >
        Logout from Partner App
      </Button>

      <ConfirmDialog
        open={logoutOpen}
        title="Go Offline & Sign Out?"
        message="Signing out turns your partner duty status Offline so you won't receive new bookings."
        confirmLabel="Logout"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmLogout}
        onCancel={() => setLogoutOpen(false)}
      />
    </div>
  );
};
