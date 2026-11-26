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
  MENU: 'MENU',
  EDIT_PROFILE: 'EDIT_PROFILE',
  ADDRESSES: 'ADDRESSES',
  PASSWORD: 'PASSWORD',
  NOTIFICATIONS: 'NOTIFICATIONS',
  HELP: 'HELP',
};

export const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState(SUBVIEWS.MENU);
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
    setActiveView(SUBVIEWS.MENU);
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
    await logout();
    setLogoutDialogOpen(false);
    showToast.success('Signed out');
    navigate('/');
  };

  const menuItems = [
    { key: SUBVIEWS.EDIT_PROFILE, label: 'Edit profile', sub: 'Name, email & phone number', icon: User },
    { key: SUBVIEWS.ADDRESSES, label: 'Saved addresses', sub: `${addresses.length} saved locations (Home, Work, Other)`, icon: MapPin },
    { key: SUBVIEWS.PASSWORD, label: 'Change password', sub: 'Update account password', icon: Lock },
    { key: SUBVIEWS.NOTIFICATIONS, label: 'Notifications settings', sub: 'Trip status, arrival & alert toggles', icon: Bell },
    { key: SUBVIEWS.HELP, label: 'Help and support', sub: 'Safety guide & FAQs', icon: HelpCircle },
  ];

  if (activeView !== SUBVIEWS.MENU) {
    const viewTitles = {
      [SUBVIEWS.EDIT_PROFILE]: { title: 'Edit Profile', subtitle: 'Update your contact details' },
      [SUBVIEWS.ADDRESSES]: { title: 'Saved Addresses', subtitle: 'Manage Home, Work & Other addresses' },
      [SUBVIEWS.PASSWORD]: { title: 'Change Password', subtitle: 'Account security settings' },
      [SUBVIEWS.NOTIFICATIONS]: { title: 'Notification Settings', subtitle: 'Control which alerts you receive' },
      [SUBVIEWS.HELP]: { title: 'Help & Support', subtitle: 'Answers & safety standards' },
    };

    const meta = viewTitles[activeView];

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <PageHeader
          title={meta.title}
          subtitle={meta.subtitle}
          onBack={() => setActiveView(SUBVIEWS.MENU)}
        />

        {activeView === SUBVIEWS.EDIT_PROFILE && (
          <form onSubmit={handleSaveProfile} className="bg-brand-white border border-gray-200 rounded-card p-5 sm:p-6 shadow-card space-y-4">
            <Input
              label="Full Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              leftIcon={<User className="w-5 h-5" strokeWidth={2} />}
            />
            <Input
              label="Email Address"
              value={user?.email || ''}
              disabled
              leftIcon={<Mail className="w-5 h-5" strokeWidth={2} />}
              helperText="Verified email cannot be changed directly."
            />
            <Input
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Phone className="w-5 h-5" strokeWidth={2} />}
            />
            <Button type="submit" variant="accent" fullWidth>
              Save Changes
            </Button>
          </form>
        )}

        {activeView === SUBVIEWS.ADDRESSES && (
          <div className="space-y-5">
            <form onSubmit={handleAddAddress} className="bg-brand-white border border-gray-200 rounded-card p-5 shadow-card space-y-4">
              <h2 className="font-display font-bold text-ds-16 text-brand-ink">Add New Address</h2>
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
              <Button type="submit" variant="accent" fullWidth leftIcon={<Plus className="w-4 h-4" />}>
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
              <div className="space-y-3">
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
                      className="w-10 h-10 rounded-card hover:bg-rose-50 text-gray-400 hover:text-status-danger flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === SUBVIEWS.PASSWORD && <ChangePasswordCard />}

        {activeView === SUBVIEWS.NOTIFICATIONS && (
          <div className="bg-brand-white border border-gray-200 rounded-card p-5 space-y-5 shadow-card">
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
        )}

        {activeView === SUBVIEWS.HELP && (
          <div className="bg-brand-white border border-gray-200 rounded-card p-5 sm:p-6 shadow-card space-y-4">
            <div className="space-y-3">
              <div className="p-4 rounded-card bg-gray-50 border border-gray-100">
                <h3 className="font-display font-bold text-ds-14 text-brand-ink">How does Start OTP work?</h3>
                <p className="text-ds-12 text-gray-600 mt-1">
                  Share your 4-digit Start OTP only when your technician arrives at your doorstep. Work cannot begin until the pro verifies it.
                </p>
              </div>
              <div className="p-4 rounded-card bg-gray-50 border border-gray-100">
                <h3 className="font-display font-bold text-ds-14 text-brand-ink">When can I cancel a booking?</h3>
                <p className="text-ds-12 text-gray-600 mt-1">
                  You can cancel any booking in Requested, Accepted, On The Way, or Arrived status from the My Bookings or Booking Detail page.
                </p>
              </div>
              <div className="p-4 rounded-card bg-brand-yellowSoft border border-brand-yellow">
                <h3 className="font-display font-bold text-ds-14 text-brand-ink">Need urgent assistance?</h3>
                <p className="text-ds-12 text-brand-ink mt-1">
                  Email support@localgo.services or review your active trip on the Bookings tab.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <PageHeader title="Profile" subtitle="Manage your account, addresses, and security" />

      {/* Avatar Header Card */}
      <div className="bg-brand-ink text-brand-white rounded-sheet p-5 sm:p-6 shadow-sheet bg-dark-grid-pattern border border-gray-900 flex items-center gap-4">
        <Avatar
          name={displayName || user?.name || user?.email}
          size="xl"
          tone="yellow"
          verified={Boolean(user?.emailVerified)}
        />
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="font-display font-bold text-ds-20 text-brand-white truncate">
            {displayName || user?.name || 'Customer'}
          </h2>
          <p className="text-ds-12 text-gray-400 truncate">{user?.email}</p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {user?.emailVerified && (
              <Badge tone="success" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
                Verified Account
              </Badge>
            )}
            <Badge tone="accent">Customer</Badge>
          </div>
        </div>
      </div>

      {/* Menu List */}
      <div className="bg-brand-white rounded-card border border-gray-200 shadow-card divide-y divide-gray-100 overflow-hidden">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveView(item.key)}
              className="w-full min-h-[64px] px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-card bg-gray-100 text-brand-ink flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <div className="font-display font-bold text-ds-14 text-brand-ink">{item.label}</div>
                  <div className="text-ds-12 text-gray-600 truncate">{item.sub}</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" strokeWidth={2} />
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setLogoutDialogOpen(true)}
          className="w-full min-h-[64px] px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-card bg-rose-50 text-status-danger flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <div className="font-display font-bold text-ds-14 text-status-danger">Logout</div>
              <div className="text-ds-12 text-gray-600">Sign out of your customer session</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-status-danger shrink-0" strokeWidth={2} />
        </button>
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
