import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  MapPin,
  ChevronDown,
  Bell,
  Home,
  Wrench,
  Calendar,
  Heart,
  User,
  LogOut,
  Map,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../hooks/useLocation';
import { useNotifications } from '../../hooks/useNotifications';
import { Logo, Avatar, Button } from '../ui';
import { LocationSheet } from '../customer/LocationSheet';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const {
    location,
    error: locError,
    loading: locLoading,
    usingGPS,
    requestGPSLocation,
    selectManualLocation,
    predefinedLocations,
  } = useLocation();
  const { unreadCount } = useNotifications();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [locationSheetOpen, setLocationSheetOpen] = useState(false);
  const navigate = useNavigate();

  const homePath = isAuthenticated ? '/dashboard' : '/';

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  const navLinks = [
    { to: homePath, label: 'Home', icon: Home },
    { to: '/services', label: 'Services', icon: Wrench },
    { to: '/my-bookings', label: 'Bookings', icon: Calendar },
    { to: '/favorites', label: 'Favorites', icon: Heart },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-brand-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 h-16 flex items-center justify-between gap-2 lg:gap-4">
          {/* Left: Logo + Location Chip */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 md:flex-initial">
            <Link to={homePath} className="shrink-0 focus-visible:outline-none">
              <Logo size="sm" subtitle={null} />
            </Link>

            <button
              type="button"
              onClick={() => setLocationSheetOpen(true)}
              aria-label="Change service location"
              className="inline-flex items-center gap-1 min-h-[38px] min-w-0 max-w-[130px] sm:max-w-[165px] md:max-w-[130px] lg:max-w-[200px] px-2.5 sm:px-3 py-1.5 rounded-pill bg-gray-100 hover:bg-brand-yellowSoft border border-gray-200 hover:border-brand-yellow text-brand-ink transition-colors duration-150 cursor-pointer overflow-hidden"
            >
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-ink shrink-0" strokeWidth={2.2} />
              <span className="text-ds-12 font-semibold truncate">
                {location?.city || 'Location'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-600 shrink-0" strokeWidth={2} />
            </button>
          </div>

          {/* Center: Clean Desktop Navigation Links */}
          <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-0.5 lg:gap-1 shrink-0">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `px-2.5 lg:px-3.5 py-2 rounded-pill text-ds-12 lg:text-ds-14 font-semibold whitespace-nowrap transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-ink text-brand-white shadow-card'
                      : 'text-gray-600 hover:text-brand-ink hover:bg-gray-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right: Notification Bell + Account Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
              className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-pill bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-center text-brand-ink transition-colors duration-150 cursor-pointer shrink-0"
            >
              <Bell className="w-5 h-5" strokeWidth={2} />
              {unreadCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-status-danger ring-2 ring-brand-white"
                />
              )}
            </button>

            {!isAuthenticated ? (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <Link
                  to="/login"
                  className="hidden lg:inline-flex items-center justify-center min-h-[42px] px-3.5 rounded-card text-ds-14 font-semibold text-brand-ink hover:bg-gray-100 transition-colors whitespace-nowrap"
                >
                  Sign In
                </Link>
                <Button
                  variant="accent"
                  onClick={() => navigate('/signup')}
                  className="min-h-[40px] py-2 px-3 sm:px-4 text-ds-12 sm:text-ds-14 whitespace-nowrap"
                >
                  <span className="sm:hidden">Sign Up</span>
                  <span className="hidden sm:inline">Get Started</span>
                </Button>
              </div>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen((p) => !p)}
                  aria-label="Open account menu"
                  aria-expanded={dropdownOpen}
                  className="flex items-center gap-1.5 p-1 lg:pr-2.5 rounded-pill border border-gray-200 bg-brand-white hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <Avatar name={user?.name || user?.email} size="sm" tone="ink" />
                  <span className="text-ds-12 font-bold text-brand-ink hidden lg:inline max-w-[100px] truncate">
                    {user?.name?.split(' ')[0] || 'Account'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-600 hidden lg:inline" strokeWidth={2} />
                </button>

                {dropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setDropdownOpen(false)}
                      aria-hidden="true"
                    />
                    <div className="absolute right-0 mt-2 w-60 bg-brand-white rounded-sheet shadow-sheet border border-gray-200 py-2 z-50">
                      <div className="px-4 py-2.5 border-b border-gray-100">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                          Signed in as
                        </p>
                        <p className="font-display font-bold text-ds-14 text-brand-ink truncate mt-0.5">
                          {user?.name || 'Customer'}
                        </p>
                        <p className="text-ds-12 text-gray-600 truncate">{user?.email}</p>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-ds-14 font-semibold text-brand-ink hover:bg-gray-50"
                        >
                          <User className="w-4 h-4 text-gray-600" strokeWidth={2} /> Profile &amp; Addresses
                        </Link>
                        <Link
                          to="/my-bookings"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-ds-14 font-semibold text-brand-ink hover:bg-gray-50"
                        >
                          <Calendar className="w-4 h-4 text-gray-600" strokeWidth={2} /> My Bookings
                        </Link>
                        <Link
                          to="/map"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-ds-14 font-semibold text-brand-ink hover:bg-gray-50"
                        >
                          <Map className="w-4 h-4 text-gray-600" strokeWidth={2} /> Live Map
                        </Link>
                        <Link
                          to="/favorites"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-ds-14 font-semibold text-brand-ink hover:bg-gray-50"
                        >
                          <Heart className="w-4 h-4 text-gray-600" strokeWidth={2} /> Saved Favorites
                        </Link>
                        <Link
                          to="/notifications"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center justify-between px-4 py-2.5 text-ds-14 font-semibold text-brand-ink hover:bg-gray-50"
                        >
                          <span className="flex items-center gap-2.5">
                            <Bell className="w-4 h-4 text-gray-600" strokeWidth={2} /> Notifications
                          </span>
                          {unreadCount > 0 && (
                            <span className="px-2 py-0.5 rounded-pill bg-brand-yellow text-brand-ink text-[11px] font-bold">
                              {unreadCount}
                            </span>
                          )}
                        </Link>
                      </div>

                      <div className="pt-1 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-ds-14 font-semibold text-status-danger hover:bg-rose-50 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" strokeWidth={2} /> Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

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
    </>
  );
};
