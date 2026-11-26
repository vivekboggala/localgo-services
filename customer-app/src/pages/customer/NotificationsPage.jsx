import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  CalendarCheck,
  Navigation,
  MapPin,
  Wrench,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
} from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { notificationService } from '../../services/notificationService';
import {
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  SkeletonList,
  showToast,
} from '../../components/ui';

const normalizeNotification = (n) => {
  const isRead = Boolean(n?.read ?? n?.isRead);
  return { ...n, read: isRead, isRead };
};

const parseNotifDate = (val) => {
  if (!val) return null;
  try {
    const d =
      typeof val?.toDate === 'function'
        ? val.toDate()
        : val?.seconds != null
          ? new Date(val.seconds * 1000)
          : new Date(val);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

const isToday = (date) => {
  if (!date) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

const getNotificationMeta = (type = '', title = '') => {
  const t = `${type} ${title}`.toUpperCase();
  if (t.includes('ON_THE_WAY') || t.includes('WAY')) {
    return { icon: Navigation, toneClass: 'bg-indigo-50 text-booking-ontheway border-indigo-200' };
  }
  if (t.includes('ARRIVED')) {
    return { icon: MapPin, toneClass: 'bg-purple-50 text-booking-arrived border-purple-200' };
  }
  if (t.includes('START') || t.includes('PROGRESS')) {
    return { icon: Wrench, toneClass: 'bg-teal-50 text-booking-inprogress border-teal-200' };
  }
  if (t.includes('COMPLETE')) {
    return { icon: CheckCircle2, toneClass: 'bg-emerald-50 text-status-success border-emerald-200' };
  }
  if (t.includes('CANCEL') || t.includes('REJECT') || t.includes('EXPIRE')) {
    return { icon: XCircle, toneClass: 'bg-rose-50 text-status-danger border-rose-200' };
  }
  if (t.includes('REVIEW') || t.includes('RATE')) {
    return { icon: Star, toneClass: 'bg-brand-yellowSoft text-brand-ink border-brand-yellow' };
  }
  if (t.includes('ACCEPT') || t.includes('BOOK')) {
    return { icon: CalendarCheck, toneClass: 'bg-blue-50 text-booking-accepted border-blue-200' };
  }
  return { icon: Bell, toneClass: 'bg-brand-yellowSoft text-brand-ink border-brand-yellow' };
};

const NotificationRow = ({ item, onMarkRead, onOpen }) => {
  const [swipeX, setSwipeX] = useState(0);
  const startXRef = useRef(null);
  const { icon: Icon, toneClass } = getNotificationMeta(item.type, item.title);
  const dateObj = parseNotifDate(item.createdAt);

  return (
    <div
      onPointerDown={(e) => {
        startXRef.current = e.clientX;
      }}
      onPointerMove={(e) => {
        if (startXRef.current === null) return;
        const delta = e.clientX - startXRef.current;
        if (Math.abs(delta) > 8 && Math.abs(delta) < 110) {
          setSwipeX(delta);
        }
      }}
      onPointerUp={() => {
        if (Math.abs(swipeX) > 60 && !item.read) {
          onMarkRead(item);
        }
        setSwipeX(0);
        startXRef.current = null;
      }}
      onPointerCancel={() => {
        setSwipeX(0);
        startXRef.current = null;
      }}
      style={{ transform: swipeX !== 0 ? `translateX(${swipeX}px)` : undefined }}
      onClick={() => onOpen(item)}
      className={`p-4 rounded-card border transition-all duration-150 flex items-start gap-3.5 cursor-pointer select-none ${
        item.read
          ? 'bg-brand-white border-gray-200 hover:border-gray-400'
          : 'bg-brand-yellowSoft/45 border-brand-yellow hover:bg-brand-yellowSoft/70 shadow-card'
      }`}
    >
      <div className={`w-11 h-11 rounded-card border flex items-center justify-center shrink-0 ${toneClass}`}>
        <Icon className="w-5 h-5" strokeWidth={2} />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h4 className="font-display font-bold text-ds-14 text-brand-ink truncate">
              {item.title || 'Booking Update'}
            </h4>
            {!item.read && (
              <span
                aria-label="Unread"
                className="w-2.5 h-2.5 rounded-full bg-status-info shrink-0"
              />
            )}
          </div>
          {dateObj && (
            <span className="text-[11px] font-medium text-gray-400 shrink-0 inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        <p className="text-ds-14 text-gray-600 leading-relaxed">{item.message}</p>

        <div className="flex items-center justify-between pt-1">
          {item.bookingId ? (
            <span className="text-ds-12 font-bold text-brand-ink">View Booking &rarr;</span>
          ) : (
            <span />
          )}
          {!item.read && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead(item);
              }}
              className="text-[11px] font-bold text-brand-ink px-2.5 py-1 rounded-pill bg-brand-white border border-gray-200 hover:bg-gray-100"
            >
              Mark read
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const NotificationsPage = () => {
  const { user, firebaseUser } = useAuth();
  const uid = firebaseUser?.uid || user?.id;
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNotifications = () => {
    if (!uid) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    notificationService.getNotifications()
      .then((data) => {
        const rawList = Array.isArray(data) ? data : (data?.content || []);
        setNotifications(rawList.map(normalizeNotification));
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Unable to load notifications.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadNotifications();
    if (!uid) return undefined;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const liveList = snapshot.docs.map((docSnap) =>
          normalizeNotification({ id: docSnap.id, ...docSnap.data() })
        );
        setNotifications(liveList);
        setLoading(false);
      },
      (err) => {
        console.warn('Real-time notifications listener error:', err);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, isRead: true })));
      showToast.success('All notifications marked as read');
    } catch {
      showToast.error('Failed to mark notifications as read');
    }
  };

  const handleMarkSingleRead = async (n) => {
    if (n.read) return;
    setNotifications((prev) =>
      prev.map((item) => (item.id === n.id ? { ...item, read: true, isRead: true } : item))
    );
    try {
      await notificationService.markAsRead(n.id);
    } catch {}
  };

  const handleOpenNotification = async (n) => {
    if (!n.read) {
      await handleMarkSingleRead(n);
    }
    if (n.bookingId) {
      navigate(`/bookings/${n.bookingId}`);
    }
  };

  const grouped = useMemo(() => {
    const today = [];
    const earlier = [];
    notifications.forEach((n) => {
      const d = parseNotifDate(n.createdAt);
      if (d && isToday(d)) {
        today.push(n);
      } else {
        earlier.push(n);
      }
    });
    return { today, earlier };
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread updates` : 'Live booking and account updates'}
        actions={
          notifications.length > 0 && (
            <Button
              variant="secondary"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              leftIcon={<CheckCheck className="w-4 h-4" strokeWidth={2} />}
            >
              Mark all read
            </Button>
          )
        }
      />

      {error && notifications.length === 0 ? (
        <ErrorState message={error} onRetry={loadNotifications} />
      ) : loading ? (
        <SkeletonList count={4} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-7 h-7" strokeWidth={2} />}
          title="No notifications yet"
          description="Booking updates, arrival alerts, and OTP reminders appear here."
          actionLabel="Explore Services"
          actionVariant="accent"
          onAction={() => navigate('/services')}
        />
      ) : (
        <div className="space-y-6">
          {grouped.today.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-ds-12 font-bold uppercase tracking-wider text-gray-600 px-1">
                Today
              </h2>
              <div className="space-y-2.5">
                {grouped.today.map((item) => (
                  <NotificationRow
                    key={item.id}
                    item={item}
                    onMarkRead={handleMarkSingleRead}
                    onOpen={handleOpenNotification}
                  />
                ))}
              </div>
            </section>
          )}

          {grouped.earlier.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-ds-12 font-bold uppercase tracking-wider text-gray-600 px-1">
                Earlier
              </h2>
              <div className="space-y-2.5">
                {grouped.earlier.map((item) => (
                  <NotificationRow
                    key={item.id}
                    item={item}
                    onMarkRead={handleMarkSingleRead}
                    onOpen={handleOpenNotification}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
