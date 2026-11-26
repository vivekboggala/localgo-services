import React, { useState, useEffect } from 'react';
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
  Search,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../hooks/useLocation';
import { useNotifications } from '../../hooks/useNotifications';
import { serviceService } from '../../services/serviceService';
import { getServiceIconComponent, getServiceStartingPrice } from '../../utils/helpers';
import { Logo, Avatar, Button } from '../ui';
import { LocationSheet } from '../customer/LocationSheet';

const FALLBACK_CATEGORIES = [
  { id: 'ac-repair', name: 'AC Repair & Service', startingPrice: 399 },
  { id: 'electrician', name: 'Electrician', startingPrice: 199 },
  { id: 'plumber', name: 'Plumber', startingPrice: 199 },
  { id: 'mobile-repair', name: 'Mobile Repair', startingPrice: 299 },
  { id: 'computer-repair', name: 'Computer & Laptop Repair', startingPrice: 349 },
  { id: 'refrigerator-repair', name: 'Refrigerator Repair', startingPrice: 299 },
  { id: 'washing-machine-repair', name: 'Washing Machine Repair', startingPrice: 299 },
  { id: 'vehicle-service', name: 'Bike & Car Service', startingPrice: 399 },
  { id: 'cleaning', name: 'Home Cleaning', startingPrice: 499 },
  { id: 'painting', name: 'Painting & Waterproofing', startingPrice: 699 },
];

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
  const [megaOpen, setMegaOpen] = useState(false);
  const [locationSheetOpen, setLocationSheetOpen] = useState(false);
  const [servicesMenu, setServicesMenu] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const homePath = isAuthenticated ? '/dashboard' : '/';

  useEffect(() => {
    serviceService.getAllServices()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setServicesMenu(data.slice(0, 10));
        }
      })
      .catch(() => {});
  }, []);

  const megaCategories = servicesMenu.length > 0 ? servicesMenu : FALLBACK_CATEGORIES;

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  const handleHeaderSearch = (e) => {
    e.preventDefault();
    const q = searchTerm.trim();
    navigate(q ? `/services?q=${encodeURIComponent(q)}` : '/services');
  };

  const navLinks = [
    { to: homePath, label: 'Home', icon: Home },
    { to: '/providers', label: 'Find Pros', icon: MapPin },
    { to: '/my-bookings', label: 'Bookings', icon: Calendar },
    { to: '/favorites', label: 'Favorites', icon: Heart },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-brand-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-3">
          {/* Left: Logo + Location Chip */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 lg:flex-initial">
            <Link to={homePath} className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink rounded-card">
              <Logo size="sm" subtitle={null} />
            </Link>

            <button
              type="button"
              onClick={() => setLocationSheetOpen(true)}
              aria-label="Change service location"
              className="inline-flex items-center gap-1 min-h-[38px] min-w-0 max-w-[112px] sm:max-w-[180px] lg:max-w-[130px] xl:max-w-[180px] px-2 sm:px-3 py-1.5 rounded-pill bg-gray-100 hover:bg-brand-yellowSoft border border-gray-200 hover:border-brand-yellow text-brand-ink transition-colors duration-150 cursor-pointer overflow-hidden"
            >
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-ink shrink-0" strokeWidth={2.2} />
              <span className="text-ds-12 font-semibold truncate">
                {location?.city || 'Location'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-600 shrink-0" strokeWidth={2} />
            </button>
          </div>

          {/* Center: Desktop Navigation + Mega Services Dropdown + XL Search (1024px+ matches BottomNav lg:hidden) */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2 flex-1 justify-center min-w-0">
            <nav aria-label="Primary navigation" className="flex items-center gap-0.5 xl:gap-1 shrink-0">
              <NavLink
                to={homePath}
                end={homePath === '/'}
                className={({ isActive }) =>
                  `px-2 xl:px-3 py-2 rounded-pill text-ds-12 xl:text-ds-14 font-semibold whitespace-nowrap transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-ink text-brand-white shadow-card'
                      : 'text-gray-600 hover:text-brand-ink hover:bg-gray-100'
                  }`
                }
              >
                Home
              </NavLink>

              {/* Mega-Style Services Dropdown Trigger */}
              <div
                className="relative"
                onMouseEnter={() => setMegaOpen(true)}
                onMouseLeave={() => setMegaOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setMegaOpen((p) => !p)}
                  aria-expanded={megaOpen}
                  className="inline-flex items-center gap-1 px-2 xl:px-3 py-2 rounded-pill text-ds-12 xl:text-ds-14 font-semibold text-gray-600 hover:text-brand-ink hover:bg-gray-100 whitespace-nowrap transition-all duration-150 cursor-pointer"
                >
                  <Wrench className="w-3.5 h-3.5 hidden xl:inline" strokeWidth={2} />
                  <span>Services</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${megaOpen ? 'rotate-180' : ''}`} strokeWidth={2} />
                </button>

                {megaOpen && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 w-[540px] lg:w-[640px] z-50">
                    <div className="bg-brand-white rounded-sheet shadow-sheet border border-gray-200 p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                            Browse Categories
                          </span>
                          <h3 className="font-display font-bold text-ds-16 text-brand-ink">
                            Home Services Near {location?.city || 'You'}
                          </h3>
                        </div>
                        <Link
                          to="/services"
                          onClick={() => setMegaOpen(false)}
                          className="inline-flex items-center gap-1 text-ds-12 font-bold text-brand-ink px-3 py-1.5 rounded-pill bg-brand-yellowSoft hover:bg-brand-yellow transition-colors"
                        >
                          View All <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.2} />
                        </Link>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {megaCategories.map((svc) => {
                          const Icon = getServiceIconComponent(svc);
                          const hasRealId = servicesMenu.some((s) => s.id === svc.id);
                          return (
                            <button
                              key={svc.id}
                              type="button"
                              onClick={() => {
                                setMegaOpen(false);
                                navigate(
                                  hasRealId
                                    ? `/providers/nearby?serviceId=${svc.id}`
                                    : `/services?q=${encodeURIComponent(svc.name)}`
                                );
                              }}
                              className="flex items-center gap-3 p-2.5 rounded-card hover:bg-gray-50 border border-transparent hover:border-gray-200 text-left transition-all cursor-pointer group"
                            >
                              <div className="w-9 h-9 rounded-card bg-brand-yellowSoft border border-brand-yellow/60 text-brand-ink group-hover:bg-brand-ink group-hover:text-brand-yellow flex items-center justify-center shrink-0 transition-colors">
                                <Icon className="w-4 h-4" strokeWidth={2} />
                              </div>
                              <div className="min-w-0">
                                <div className="font-display font-bold text-ds-12 text-brand-ink truncate">
                                  {svc.name}
                                </div>
                                <div className="text-[11px] text-gray-600">
                                  from Rs {getServiceStartingPrice(svc)}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {navLinks.slice(1).map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `px-2 xl:px-3 py-2 rounded-pill text-ds-12 xl:text-ds-14 font-semibold whitespace-nowrap transition-all duration-150 ${
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

            {/* XL Screen Inline Search Box */}
            <form onSubmit={handleHeaderSearch} className="hidden xl:flex items-center relative w-64 ml-2">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" strokeWidth={2} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search service or pro..."
                aria-label="Quick service search"
                className="w-full h-10 pl-9 pr-3 rounded-pill bg-gray-100 focus:bg-brand-white border border-gray-200 focus:border-brand-ink text-ds-12 font-medium text-brand-ink placeholder:text-gray-400 outline-none transition-colors"
              />
            </form>
          </div>

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
                  className="min-h-[38px] py-1.5 px-2.5 sm:px-4 text-ds-12 xl:text-ds-14 whitespace-nowrap"
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
