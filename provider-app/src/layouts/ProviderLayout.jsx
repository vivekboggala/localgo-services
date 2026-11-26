import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { useProviderPresence } from '../hooks/useProviderPresence';
import { useNotifications } from '../hooks/useNotifications';
import { notificationService } from '../services/notificationService';
import { providerPortalService } from '../services/providerPortalService';
import {
  BottomNav,
  BottomSheet,
  Button,
  EmptyState,
  Logo,
  SkeletonList,
  showToast,
} from '../components/ui';
import { parseFirestoreDate } from '../utils/helpers';

export const ProviderLayout = () => {
  const { user, firebaseUser } = useAuth();
  const { isDark } = useTheme();
  const uid = firebaseUser?.uid || user?.id;
  const navigate = useNavigate();

  const { available, updating, toggleAvailability } = useProviderPresence(Boolean(uid));
  const { unreadCount, fetchUnreadCount } = useNotifications();

  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifList, setNotifList] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);

  // Real-time pending request badge count
  useEffect(() => {
    if (!uid) {
      setPendingRequestCount(0);
      return undefined;
    }

    providerPortalService.getPendingRequests(0, 50)
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.content || []);
        setPendingRequestCount(list.length);
      })
      .catch(() => {});

    const q = query(
      collection(db, 'bookings'),
      where('providerId', '==', uid),
      where('status', '==', 'REQUESTED')
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => setPendingRequestCount(snap.size),
      () => {}
    );

    return () => unsubscribe();
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

  const handleHeaderToggle = async () => {
    try {
      const next = await toggleAvailability();
      if (typeof next === 'boolean') {
        showToast.success(next ? 'You are now ONLINE and receiving requests' : 'You are now OFFLINE');
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to update online status.');
    }
  };

  const desktopNavItems = [
    { to: '/dashboard', label: 'Home' },
    { to: '/requests', label: 'Requests', badge: pendingRequestCount },
    { to: '/jobs', label: 'Jobs' },
    { to: '/bookings', label: 'History' },
    { to: '/earnings', label: 'Earnings' },
    { to: '/profile', label: 'Profile' },
  ];

  const mobileBottomItems = [
    { key: 'home', label: 'Home', icon: Home, to: '/dashboard' },
    { key: 'requests', label: 'Requests', icon: Inbox, to: '/requests', badge: pendingRequestCount },
    { key: 'jobs', label: 'Jobs', icon: Wrench, to: '/jobs' },
    { key: 'earnings', label: 'Earnings', icon: DollarSign, to: '/earnings' },
    { key: 'profile', label: 'Profile', icon: User, to: '/profile' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-brand-ink text-brand-ink dark:text-brand-white">
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 bg-brand-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-600/30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          <Link to="/dashboard" className="shrink-0 focus-visible:outline-none">
            <Logo variant={isDark ? 'dark' : 'light'} size="sm" subtitle="Partner" />
          </Link>

          {/* Desktop Navigation */}
          <nav aria-label="Provider navigation" className="hidden md:flex items-center gap-1">
            {desktopNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `inline-flex items-center gap-1.5 px-3 py-2 rounded-pill text-ds-12 lg:text-ds-14 font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-brand-yellow text-brand-ink shadow-card'
                      : 'text-gray-600 dark:text-gray-400 hover:text-brand-ink dark:hover:text-brand-white hover:bg-gray-100 dark:hover:bg-brand-ink'
                  }`
                }
              >
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span className="px-1.5 py-0.5 rounded-pill bg-status-danger text-brand-white text-[10px] font-extrabold leading-none">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right: Prominent Online/Offline Pill Toggle + Bell */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleHeaderToggle}
              disabled={updating}
              aria-label={available ? 'Go Offline' : 'Go Online'}
              className={`min-h-[44px] px-3.5 sm:px-4 rounded-pill font-display font-extrabold text-ds-12 sm:text-ds-14 border-2 inline-flex items-center gap-2 transition-all duration-150 active:scale-95 disabled:opacity-60 cursor-pointer ${
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
              <Power className="w-4 h-4 shrink-0 sm:hidden" strokeWidth={2.4} />
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
          </div>
        </div>
      </header>

      <main className="flex-grow pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* Mobile 5-Tab Bottom Navigation */}
      <div className="md:hidden">
        <BottomNav items={mobileBottomItems} fixed={true} />
      </div>

      {/* Live Notifications Drawer Sheet */}
      <BottomSheet
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread updates` : 'Live request & job alerts'}
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
                  className={`w-full text-left p-4 rounded-card border transition-colors flex items-start justify-between gap-3 ${
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
