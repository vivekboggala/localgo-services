import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import {
  Home,
  Inbox,
  Wrench,
  DollarSign,
  User,
  Bell,
  CheckCheck,
  Clock,
  Power,
  Calendar,
  ChevronDown,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { useProviderPresence } from '../hooks/useProviderPresence';
import { useNotifications } from '../hooks/useNotifications';
import { notificationService } from '../services/notificationService';
import { providerPortalService } from '../services/providerPortalService';
import {
  Avatar,
  BottomNav,
  BottomSheet,
  Button,
  EmptyState,
  Logo,
  SkeletonList,
  showToast,
} from '../components/ui';
import { parseFirestoreDate } from '../utils/helpers';

const PAGE_TITLES = [
  { prefix: '/dashboard', title: 'Partner Dashboard' },
  { prefix: '/requests', title: 'Incoming Requests' },
  { prefix: '/jobs/', title: 'Job Execution' },
  { prefix: '/jobs', title: 'Active Jobs' },
  { prefix: '/bookings', title: 'Bookings History' },
  { prefix: '/earnings', title: 'Earnings & Payouts' },
  { prefix: '/profile', title: 'Partner Profile' },
];

export const ProviderLayout = () => {
  const { user, firebaseUser, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const uid = firebaseUser?.uid || user?.id;
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const { available, updating, toggleAvailability } = useProviderPresence(Boolean(uid));
  const { unreadCount, fetchUnreadCount } = useNotifications();

  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifList, setNotifList] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const pageTitle = useMemo(() => {
    const match = PAGE_TITLES.find((t) => pathname.startsWith(t.prefix));
    return match ? match.title : 'LocalGo Partner';
  }, [pathname]);

  useEffect(() => {
    if (!uid) {
      setPendingRequestCount(0);
      return undefined;
    }

    let cancelled = false;
    let snapshotActive = false;

    const refreshCount = () => {
      providerPortalService.getPendingRequests(0, 50)
        .then((data) => {
          if (cancelled || snapshotActive) return;
          const list = Array.isArray(data) ? data : (data?.content || []);
          setPendingRequestCount(list.length);
        })
        .catch(() => {});
    };

    refreshCount();

    const q = query(
      collection(db, 'bookings'),
      where('providerId', '==', uid),
      where('status', '==', 'REQUESTED')
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        snapshotActive = true;
        setPendingRequestCount(snap.size);
      },
      () => {
        // Fallback if Firestore listener errors: keep API count refreshed
        snapshotActive = false;
      }
    );

    const handleRequestsUpdated = () => {
      snapshotActive = false;
      refreshCount();
    };
    window.addEventListener('localgo:requests-updated', handleRequestsUpdated);

    return () => {
      cancelled = true;
      unsubscribe();
      window.removeEventListener('localgo:requests-updated', handleRequestsUpdated);
    };
  }, [uid]);

  const loadNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const data = await notificationService.getNotifications(0, 25);
      const list = Array.isArray(data) ? data : (data?.content || []);
      setNotifList(list.map((n) => ({ ...n, read: Boolean(n?.read ?? n?.isRead) })));
    } catch {
      setNotifList([]);
    } finally {
      setNotifLoading(false);
    }
  }, []);

  const handleOpenNotifications = () => {
    setNotifOpen(true);
    loadNotifications();
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifList((prev) => prev.map((n) => ({ ...n, read: true })));
      fetchUnreadCount();
      showToast.success('All notifications marked as read');
    } catch {
      showToast.error('Failed to mark all as read');
    }
  };

  const handleNotificationTap = async (item) => {
    if (!item.read) {
      setNotifList((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
      notificationService.markAsRead(item.id).then(fetchUnreadCount).catch(() => {});
    }
    setNotifOpen(false);
    if (item.bookingId) {
      navigate(`/jobs/${item.bookingId}`);
    }
  };

  const handleDutyToggle = async () => {
    try {
      const next = await toggleAvailability();
      if (typeof next === 'boolean') {
        showToast.success(next ? 'You are now ONLINE and receiving requests' : 'You are now OFFLINE');
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to update online status.');
    }
  };

  const handleSignOut = async () => {
    setProfileMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const sidebarItems = [
    { to: '/dashboard', label: 'Dashboard', icon: Home },
    { to: '/requests', label: 'Requests', icon: Inbox, badge: pendingRequestCount },
    { to: '/jobs', label: 'Active jobs', icon: Wrench },
    { to: '/bookings', label: 'Bookings', icon: Calendar },
    { to: '/earnings', label: 'Earnings', icon: DollarSign },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  const mobileBottomItems = [
    { key: 'home', label: 'Home', icon: Home, to: '/dashboard' },
    { key: 'requests', label: 'Requests', icon: Inbox, to: '/requests', badge: pendingRequestCount },
    { key: 'jobs', label: 'Jobs', icon: Wrench, to: '/jobs' },
    { key: 'earnings', label: 'Earnings', icon: DollarSign, to: '/earnings' },
    { key: 'profile', label: 'Profile', icon: User, to: '/profile' },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-brand-ink text-brand-ink dark:text-brand-white">
      {/* FIXED LEFT SIDEBAR (240px on lg and up) */}
      <aside className="hidden lg:flex lg:w-[240px] shrink-0 flex-col justify-between bg-brand-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-600/25 sticky top-0 h-screen p-4">
        <div className="space-y-6">
          <Link to="/dashboard" className="inline-flex px-2 pt-1 focus-visible:outline-none">
            <Logo variant={isDark ? 'dark' : 'light'} size="sm" subtitle="Partner" />
          </Link>

          <nav aria-label="Partner sidebar navigation" className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between gap-2.5 px-3.5 py-3 rounded-card text-ds-14 font-bold transition-all duration-150 ${
                      isActive
                        ? 'bg-brand-yellow text-brand-ink shadow-card'
                        : 'text-gray-600 dark:text-gray-400 hover:text-brand-ink dark:hover:text-brand-white hover:bg-gray-100 dark:hover:bg-brand-ink'
                    }`
                  }
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Icon className="w-5 h-5 shrink-0" strokeWidth={2} />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge > 0 && (
                    <span className="px-2 py-0.5 rounded-pill bg-status-danger text-brand-white text-[11px] font-extrabold leading-none shrink-0">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Persistent Online/Offline Duty Card */}
        <div
          className={`rounded-card p-3.5 border-2 transition-colors space-y-2.5 ${
            available
              ? 'bg-emerald-500/10 border-status-success'
              : 'bg-gray-100 dark:bg-brand-ink border-gray-200 dark:border-gray-600/35'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  available ? 'bg-status-success animate-pulse' : 'bg-status-danger'
                }`}
              />
              <span className="font-display font-extrabold text-ds-12 uppercase tracking-wider text-brand-ink dark:text-brand-white">
                {available ? 'Duty Online' : 'Duty Offline'}
              </span>
            </div>
            <Power className={`w-4 h-4 ${available ? 'text-status-success' : 'text-gray-400'}`} />
          </div>

          <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-snug">
            {available ? 'Receiving live booking alerts' : 'Hidden from nearby customer search'}
          </p>

          <button
            type="button"
            onClick={handleDutyToggle}
            disabled={updating}
            className={`w-full min-h-[42px] rounded-card font-display font-extrabold text-ds-12 transition-all active:scale-95 disabled:opacity-60 cursor-pointer ${
              available
                ? 'bg-status-success hover:opacity-90 text-brand-white'
                : 'bg-brand-yellow hover:bg-brand-yellowHover text-brand-ink'
            }`}
          >
            {updating ? 'Updating...' : available ? 'Go Offline' : 'Go Online'}
          </button>
        </div>
      </aside>

      {/* RIGHT CONTENT SHELL */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top App Bar */}
        <header className="sticky top-0 z-40 h-16 bg-brand-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-600/25">
          <div className="h-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex items-center justify-between gap-3">
            {/* Mobile Logo / Desktop Page Title */}
            <div className="flex items-center gap-3 min-w-0">
              <Link to="/dashboard" className="lg:hidden shrink-0">
                <Logo variant={isDark ? 'dark' : 'light'} size="sm" subtitle="Partner" />
              </Link>
              <div className="hidden lg:block min-w-0">
                <h1 className="font-display font-bold text-ds-20 text-brand-ink dark:text-brand-white truncate">
                  {pageTitle}
                </h1>
              </div>
            </div>

            {/* Right Controls: Mobile Online Pill + Bell + Desktop Profile Menu */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleDutyToggle}
                disabled={updating}
                aria-label={available ? 'Go Offline' : 'Go Online'}
                className={`lg:hidden min-h-[42px] px-3.5 rounded-pill font-display font-extrabold text-ds-12 border-2 inline-flex items-center gap-2 transition-all active:scale-95 disabled:opacity-60 cursor-pointer ${
                  available
                    ? 'bg-status-success text-brand-white border-emerald-400 shadow-card'
                    : 'bg-gray-100 dark:bg-brand-ink text-gray-900 dark:text-gray-200 border-gray-200 dark:border-gray-600/50'
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    available ? 'bg-brand-white animate-pulse' : 'bg-status-danger'
                  }`}
                />
                <span>{updating ? '...' : available ? 'Online' : 'Offline'}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenNotifications}
                aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
                className="relative w-11 h-11 min-w-[44px] min-h-[44px] rounded-pill bg-gray-100 dark:bg-brand-ink border border-gray-200 dark:border-gray-600/40 flex items-center justify-center text-brand-ink dark:text-brand-white hover:border-brand-yellow transition-colors cursor-pointer"
              >
                <Bell className="w-5 h-5" strokeWidth={2.2} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2.5 w-2.5 h-2.5 rounded-full bg-status-danger ring-2 ring-brand-white dark:ring-gray-900" />
                )}
              </button>

              <div className="hidden lg:block relative">
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((p) => !p)}
                  aria-label="Open partner menu"
                  aria-expanded={profileMenuOpen}
                  className="flex items-center gap-2 p-1 pr-3 rounded-pill bg-gray-100 dark:bg-brand-ink border border-gray-200 dark:border-gray-600/40 hover:border-brand-yellow transition-colors cursor-pointer"
                >
                  <Avatar name={user?.name || user?.email} size="sm" tone="yellow" />
                  <span className="text-ds-12 font-bold text-brand-ink dark:text-brand-white max-w-[120px] truncate">
                    {user?.name?.split(' ')[0] || 'Partner'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {profileMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} aria-hidden="true" />
                    <div className="absolute right-0 mt-2 w-56 bg-brand-white dark:bg-gray-900 rounded-sheet border border-gray-200 dark:border-gray-600/35 shadow-sheet py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-600/20">
                        <div className="font-display font-bold text-ds-14 text-brand-ink dark:text-brand-white truncate">
                          {user?.name || 'Partner'}
                        </div>
                        <div className="text-[11px] text-gray-400 truncate">{user?.email}</div>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-ds-14 font-semibold hover:bg-gray-100 dark:hover:bg-brand-ink"
                      >
                        <User className="w-4 h-4 text-brand-yellow" /> Profile &amp; Settings
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          toggleTheme();
                          setProfileMenuOpen(false);
                        }}
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-ds-14 font-semibold hover:bg-gray-100 dark:hover:bg-brand-ink cursor-pointer"
                      >
                        {isDark ? <Sun className="w-4 h-4 text-brand-yellow" /> : <Moon className="w-4 h-4 text-brand-ink" />}
                        {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                      </button>
                      <div className="border-t border-gray-100 dark:border-gray-600/20 mt-1 pt-1">
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-ds-14 font-semibold text-status-danger hover:bg-rose-500/10 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Full Remaining Width with max-w-7xl + 24-32px desktop padding */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav (< lg) */}
      <div className="lg:hidden">
        <BottomNav items={mobileBottomItems} fixed={true} />
      </div>

      {/* Live Notifications Drawer / Sheet */}
      <BottomSheet
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread updates` : 'Live request & job alerts'}
        desktopPresentation="drawer"
        footer={
          notifList.length > 0 ? (
            <Button
              variant="secondary"
              fullWidth
              disabled={unreadCount === 0}
              leftIcon={<CheckCheck className="w-4 h-4" />}
              onClick={handleMarkAllRead}
            >
              Mark all read
            </Button>
          ) : null
        }
      >
        {notifLoading ? (
          <SkeletonList count={3} />
        ) : notifList.length === 0 ? (
          <EmptyState
            icon={<Bell className="w-7 h-7" />}
            title="All caught up"
            description="New booking alerts and arrival notifications appear here."
          />
        ) : (
          <div className="space-y-2.5">
            {notifList.map((n) => {
              const dt = parseFirestoreDate(n.createdAt);
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleNotificationTap(n)}
                  className={`w-full text-left p-4 rounded-card border transition-colors flex items-start justify-between gap-3 cursor-pointer ${
                    n.read
                      ? 'bg-brand-white dark:bg-brand-ink border-gray-200 dark:border-gray-600/30'
                      : 'bg-brand-yellowSoft/60 dark:bg-brand-yellow/10 border-brand-yellow'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-ds-14 text-brand-ink dark:text-brand-white truncate">
                        {n.title}
                      </span>
                      {!n.read && <span className="w-2.5 h-2.5 rounded-full bg-brand-yellow shrink-0" />}
                    </div>
                    <p className="text-ds-12 text-gray-600 dark:text-gray-200 leading-relaxed">{n.message}</p>
                    {dt && (
                      <span className="text-[11px] text-gray-400 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {dt.toLocaleString()}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
