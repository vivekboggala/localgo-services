import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  MapPin,
  Lock,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Mail,
  Phone,
  Home,
  Briefcase,
  Trash2,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import ChangePasswordCard from '../../components/auth/ChangePasswordCard';
import {
  Avatar,
  Badge,
  Button,
  Chip,
  ConfirmDialog,
  EmptyState,
  Input,
  PageHeader,
  Toggle,
  showToast,
} from '../../components/ui';

const SUBVIEWS = {
  EDIT_PROFILE: 'EDIT_PROFILE',
  ADDRESSES: 'ADDRESSES',
  PASSWORD: 'PASSWORD',
  NOTIFICATIONS: 'NOTIFICATIONS',
  HELP: 'HELP',
};

export const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Desktop always shows active panel; mobile starts on Menu list if mobileOpenView is null
  const [activeTab, setActiveTab] = useState(SUBVIEWS.EDIT_PROFILE);
  const [mobileSubOpen, setMobileSubOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  // Local profile display edits
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // Saved addresses synced with BookingFlow
  const addressStorageKey = `localgo_saved_addresses_${user?.id || 'guest'}`;
  const [addresses, setAddresses] = useState(() => {
    try {
      const saved = localStorage.getItem(addressStorageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return user?.address
      ? [{ id: 'addr-1', label: 'Home', address: user.address, city: user.city || '', postalCode: user.postalCode || '' }]
      : [];
  });
  const [newLabel, setNewLabel] = useState('Home');
  const [newAddressText, setNewAddressText] = useState('');
  const [newCityText, setNewCityText] = useState(user?.city || '');

  // Notification preferences
  const [notifPrefs, setNotifPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem(`localgo_notif_prefs_${user?.id || 'guest'}`);
      return saved ? JSON.parse(saved) : { bookingUpdates: true, arrivalOtp: true, promotions: false };
    } catch {
      return { bookingUpdates: true, arrivalOtp: true, promotions: false };
    }
  });

  const persistAddresses = (next) => {
    setAddresses(next);
    try {
      localStorage.setItem(addressStorageKey, JSON.stringify(next));
    } catch {}
  };

  const handleAddAddress = (e) => {
    e.preventDefault();
    if (!newAddressText.trim()) {
      showToast.error('Enter the full address.');
      return;
    }
    const next = [
      {
        id: `addr-${Date.now()}`,
        label: newLabel,
        address: newAddressText.trim(),
        city: newCityText.trim() || 'Local Area',
      },
      ...addresses,
    ];
    persistAddresses(next);
    setNewAddressText('');
    showToast.success(`Saved ${newLabel} address`);
  };

  const handleDeleteAddress = (id) => {
    persistAddresses(addresses.filter((a) => a.id !== id));
    showToast.success('Address removed');
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    try {
      const updatedUser = { ...user, name: displayName.trim() || user?.name, phone: phone.trim() || user?.phone };
      localStorage.setItem('localgo_user', JSON.stringify(updatedUser));
    } catch {}
    showToast.success('Profile preferences updated');
  };

  const updatePref = (key, value) => {
    const next = { ...notifPrefs, [key]: value };
    setNotifPrefs(next);
    try {
      localStorage.setItem(`localgo_notif_prefs_${user?.id || 'guest'}`, JSON.stringify(next));
    } catch {}
    showToast.success('Preferences saved');
  };

  const handleConfirmLogout = async () => {
    try {
      await logout();
      setLogoutDialogOpen(false);
      showToast.success('Signed out');
      navigate('/');
    } catch (err) {
      showToast.error(err?.message || 'Failed to sign out. Please try again.');
    }
  };

  const menuItems = [
    { key: SUBVIEWS.EDIT_PROFILE, label: 'Profile', sub: 'Name, email & phone number', icon: User },
    { key: SUBVIEWS.ADDRESSES, label: 'Saved addresses', sub: `${addresses.length} saved locations`, icon: MapPin },
    { key: SUBVIEWS.PASSWORD, label: 'Change password', sub: 'Update account password', icon: Lock },
    { key: SUBVIEWS.NOTIFICATIONS, label: 'Notifications', sub: 'Trip status & arrival alerts', icon: Bell },
    { key: SUBVIEWS.HELP, label: 'Help & support', sub: 'Safety guide & FAQs', icon: HelpCircle },
  ];

  const renderActiveContent = () => {
    if (activeTab === SUBVIEWS.EDIT_PROFILE) {
      return (
        <form onSubmit={handleSaveProfile} className="bg-brand-white border border-gray-200 rounded-card p-6 shadow-card space-y-5">
          <div>
            <h2 className="font-display font-bold text-ds-20 text-brand-ink">Personal Information</h2>
            <p className="text-ds-12 text-gray-600 mt-0.5">Manage how your name and contact details appear on bookings</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              leftIcon={<User className="w-5 h-5" strokeWidth={2} />}
            />
            <Input
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Phone className="w-5 h-5" strokeWidth={2} />}
            />
          </div>
          <Input
            label="Email Address"
            value={user?.email || ''}
            disabled
            leftIcon={<Mail className="w-5 h-5" strokeWidth={2} />}
            helperText="Verified email cannot be changed directly."
          />
          <div className="pt-2">
            <Button type="submit" variant="accent">
              Save Changes
            </Button>
          </div>
        </form>
      );
    }

    if (activeTab === SUBVIEWS.ADDRESSES) {
      return (
        <div className="space-y-6">
          <form onSubmit={handleAddAddress} className="bg-brand-white border border-gray-200 rounded-card p-6 shadow-card space-y-4">
            <h2 className="font-display font-bold text-ds-20 text-brand-ink">Add New Address</h2>
            <div className="flex flex-wrap gap-2">
              {['Home', 'Work', 'Other'].map((lbl) => (
                <Chip
                  key={lbl}
                  selected={newLabel === lbl}
                  tone="yellow"
                  onClick={() => setNewLabel(lbl)}
                >
                  {lbl}
                </Chip>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Doorstep Address"
                required
                value={newAddressText}
                onChange={(e) => setNewAddressText(e.target.value)}
                placeholder="House No, Street, Landmark..."
                leftIcon={<MapPin className="w-5 h-5" strokeWidth={2} />}
              />
              <Input
                label="City / Locality"
                value={newCityText}
                onChange={(e) => setNewCityText(e.target.value)}
                placeholder="e.g. Bengaluru"
              />
            </div>
            <Button type="submit" variant="accent" leftIcon={<Plus className="w-4 h-4" />}>
              Save Address
            </Button>
          </form>

          {addresses.length === 0 ? (
            <EmptyState
              icon={<MapPin className="w-7 h-7" strokeWidth={2} />}
              title="No saved addresses yet"
              description="Save your Home or Work address for one-tap booking."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="bg-brand-white border border-gray-200 rounded-card p-4 shadow-card flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-card bg-brand-yellowSoft border border-brand-yellow text-brand-ink flex items-center justify-center shrink-0">
                      {addr.label === 'Work' ? <Briefcase className="w-5 h-5" /> : <Home className="w-5 h-5" />}
                    </div>
                    <div>
                      <Badge tone="neutral" className="mb-1">{addr.label}</Badge>
                      <p className="font-semibold text-ds-14 text-brand-ink">{addr.address}</p>
                      {addr.city && <p className="text-ds-12 text-gray-600 mt-0.5">{addr.city}</p>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteAddress(addr.id)}
                    aria-label="Delete address"
                    className="w-10 h-10 rounded-card hover:bg-rose-50 text-gray-400 hover:text-status-danger flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === SUBVIEWS.PASSWORD) {
      return <ChangePasswordCard />;
    }

    if (activeTab === SUBVIEWS.NOTIFICATIONS) {
      return (
        <div className="bg-brand-white border border-gray-200 rounded-card p-6 space-y-5 shadow-card">
          <div>
            <h2 className="font-display font-bold text-ds-20 text-brand-ink">Notification Preferences</h2>
            <p className="text-ds-12 text-gray-600 mt-0.5">Choose how LocalGo keeps you informed</p>
          </div>
          <Toggle
            checked={notifPrefs.bookingUpdates}
            onChange={(val) => updatePref('bookingUpdates', val)}
            label="Booking & status updates"
            description="Alerts when pros accept, travel, or finish your job"
          />
          <div className="border-t border-gray-100 pt-4">
            <Toggle
              checked={notifPrefs.arrivalOtp}
              onChange={(val) => updatePref('arrivalOtp', val)}
              label="Arrival & Start OTP reminders"
              description="Notify when your pro reaches your doorstep"
            />
          </div>
          <div className="border-t border-gray-100 pt-4">
            <Toggle
              checked={notifPrefs.promotions}
              onChange={(val) => updatePref('promotions', val)}
              label="Service offers & seasonal tips"
              description="Maintenance reminders for AC, plumbing & electrical"
            />
          </div>
        </div>
      );
    }

    return (
      <div className="bg-brand-white border border-gray-200 rounded-card p-6 shadow-card space-y-4">
        <h2 className="font-display font-bold text-ds-20 text-brand-ink">Help &amp; Support</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-card bg-gray-50 border border-gray-100">
            <h3 className="font-display font-bold text-ds-14 text-brand-ink">How does Start OTP work?</h3>
            <p className="text-ds-12 text-gray-600 mt-1 leading-relaxed">
              Share your 4-digit Start OTP only when your technician arrives at your doorstep. Work cannot begin until the pro verifies it.
            </p>
          </div>
          <div className="p-4 rounded-card bg-gray-50 border border-gray-100">
            <h3 className="font-display font-bold text-ds-14 text-brand-ink">When can I cancel a booking?</h3>
            <p className="text-ds-12 text-gray-600 mt-1 leading-relaxed">
              You can cancel any booking in Requested, Accepted, On The Way, or Arrived status from the My Bookings or Booking Detail page.
            </p>
          </div>
        </div>
        <div className="p-4 rounded-card bg-brand-yellowSoft border border-brand-yellow">
          <h3 className="font-display font-bold text-ds-14 text-brand-ink">Need urgent assistance?</h3>
          <p className="text-ds-12 text-brand-ink mt-1">
            Email support@localgo.services or review your active trip on the Bookings tab.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <PageHeader
        title="Profile & Settings"
        subtitle="Manage your account details, doorstep addresses, and security"
        onBack={mobileSubOpen ? () => setMobileSubOpen(false) : null}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT SETTINGS SIDEBAR (Desktop always visible; Mobile shown when !mobileSubOpen) */}
        <aside className={`${mobileSubOpen ? 'hidden lg:block' : 'block'} lg:col-span-4 xl:col-span-3 space-y-5`}>
          <div className="bg-brand-ink text-brand-white rounded-sheet p-5 shadow-sheet bg-dark-grid-pattern border border-gray-900 flex items-center gap-4">
            <Avatar
              name={displayName || user?.name || user?.email}
              size="lg"
              tone="yellow"
              verified={Boolean(user?.emailVerified)}
            />
            <div className="min-w-0 flex-1 space-y-1">
              <h2 className="font-display font-bold text-ds-16 text-brand-white truncate">
                {displayName || user?.name || 'Customer'}
              </h2>
              <p className="text-ds-12 text-gray-400 truncate">{user?.email}</p>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {user?.emailVerified && (
                  <Badge tone="success" icon={<ShieldCheck className="w-3 h-3" />}>
                    Verified
                  </Badge>
                )}
                <Badge tone="accent">Customer</Badge>
              </div>
            </div>
          </div>

          <div className="bg-brand-white rounded-card border border-gray-200 shadow-card divide-y divide-gray-100 overflow-hidden">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.key);
                    setMobileSubOpen(true);
                  }}
                  className={`w-full min-h-[60px] px-4 py-3 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'lg:bg-brand-yellowSoft/70 lg:border-l-4 lg:border-l-brand-ink hover:bg-brand-yellowSoft'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-card flex items-center justify-center shrink-0 ${
                        isSelected ? 'lg:bg-brand-ink lg:text-brand-yellow bg-gray-100 text-brand-ink' : 'bg-gray-100 text-brand-ink'
                      }`}
                    >
                      <Icon className="w-4 h-4" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-display font-bold text-ds-14 text-brand-ink">{item.label}</div>
                      <div className="text-[11px] text-gray-600 truncate">{item.sub}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 lg:hidden" strokeWidth={2} />
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setLogoutDialogOpen(true)}
              className="w-full min-h-[60px] px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-card bg-rose-50 text-status-danger flex items-center justify-center shrink-0">
                  <LogOut className="w-4 h-4" strokeWidth={2} />
                </div>
                <div>
                  <div className="font-display font-bold text-ds-14 text-status-danger">Logout</div>
                  <div className="text-[11px] text-gray-600">Sign out of your session</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-status-danger shrink-0 lg:hidden" strokeWidth={2} />
            </button>
          </div>
        </aside>

        {/* RIGHT SETTINGS CONTENT PANEL (Desktop always visible; Mobile visible when mobileSubOpen) */}
        <section className={`${mobileSubOpen ? 'block' : 'hidden lg:block'} lg:col-span-8 xl:col-span-9`}>
          {renderActiveContent()}
        </section>
      </div>

      <ConfirmDialog
        open={logoutDialogOpen}
        title="Sign out of LocalGo?"
        message="You can sign back in anytime with your email and password."
        confirmLabel="Logout"
        cancelLabel="Stay Signed In"
        variant="danger"
        onConfirm={handleConfirmLogout}
        onCancel={() => setLogoutDialogOpen(false)}
      />
    </div>
  );
};

export default ProfilePage;
