import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from 'recharts';
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  ArrowRight,
  Star,
  Briefcase,
  DollarSign,
  TrendingUp,
  ChevronsRight,
  Power,
  Wrench,
  Calendar,
  MapPin,
  Inbox,
  User,
} from 'lucide-react';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { providerPortalService } from '../../services/providerPortalService';
import {
  useProviderPresence,
  PROVIDER_AVAILABILITY_EVENT,
  dispatchAvailabilityChange,
  formatOnlineDuration,
} from '../../hooks/useProviderPresence';
import { RequestCard } from '../../components/provider/RequestCard';
import {
  Button,
  EmptyState,
  ErrorState,
  SkeletonCard,
  StatusBadge,
  showToast,
} from '../../components/ui';
import { formatCurrency } from '../../utils/helpers';

const SlideAvailabilityButton = ({ available, onlineSince, updating, onToggle }) => {
  const trackRef = useRef(null);
  const startXRef = useRef(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [durationText, setDurationText] = useState(() => formatOnlineDuration(onlineSince));

  useEffect(() => {
    if (!available || !onlineSince) {
      setDurationText('0m');
      return undefined;
    }
    setDurationText(formatOnlineDuration(onlineSince));
    const timer = setInterval(() => {
      setDurationText(formatOnlineDuration(onlineSince));
    }, 30000);
    return () => clearInterval(timer);
  }, [available, onlineSince]);

  const maxTravel = () => {
    const width = trackRef.current?.offsetWidth || 300;
    return Math.max(120, width - 68);
  };

  const handlePointerDown = (e) => {
    if (updating) return;
    startXRef.current = e.clientX;
  };

  const handlePointerMove = (e) => {
    if (startXRef.current === null || updating) return;
    const delta = e.clientX - startXRef.current;
    const clamped = Math.max(0, Math.min(maxTravel(), delta));
    setDragOffset(clamped);
  };

  const handlePointerUp = () => {
    if (startXRef.current === null) return;
    const triggered = dragOffset > maxTravel() * 0.45;
    startXRef.current = null;
    setDragOffset(0);
    if (triggered) {
      onToggle();
    }
  };

  return (
    <div className="space-y-2">
      <div
        ref={trackRef}
        className={`relative h-[68px] rounded-sheet p-1.5 border-2 overflow-hidden select-none transition-colors duration-200 shadow-sheet flex items-center ${
          available
            ? 'bg-status-success border-emerald-400 text-brand-white'
            : 'bg-gray-900 border-brand-yellow text-brand-white'
        }`}
      >
        {/* Slide Thumb */}
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={() => dragOffset === 0 && onToggle()}
          disabled={updating}
          aria-label={available ? 'Slide or tap to go offline' : 'Slide or tap to go online'}
          style={{ transform: `translateX(${dragOffset}px)` }}
          className={`relative z-10 w-14 h-14 rounded-card flex items-center justify-center shadow-panel transition-transform duration-150 shrink-0 cursor-grab active:cursor-grabbing ${
            available
              ? 'bg-brand-white text-status-success'
              : 'bg-brand-yellow text-brand-ink'
          }`}
        >
          {updating ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <ChevronsRight className="w-7 h-7" strokeWidth={2.5} />
          )}
        </button>

        {/* Track Label (also tappable) */}
        <button
          type="button"
          onClick={onToggle}
          disabled={updating}
          className="flex-1 h-full flex flex-col items-center justify-center px-3 text-center cursor-pointer"
        >
          <span className="font-display font-extrabold text-ds-16 sm:text-ds-20 tracking-tight uppercase">
            {updating ? 'Updating Status...' : available ? 'GO OFFLINE' : 'GO ONLINE'}
          </span>
          <span className={`text-[11px] font-semibold ${available ? 'text-emerald-100' : 'text-brand-yellow'}`}>
            {available ? 'Slide or tap to pause dispatch' : 'Slide or tap to start receiving jobs'}
          </span>
        </button>

        <div className="w-10 flex items-center justify-center opacity-80 pr-2 pointer-events-none">
          <Power className="w-5 h-5" strokeWidth={2.2} />
        </div>
      </div>

      {/* Live Heartbeat Status Line */}
      <div className="flex items-center justify-between px-2 text-ds-12 font-semibold">
        <span className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-200">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              available ? 'bg-status-success animate-pulse' : 'bg-gray-400'
            }`}
          />
          {available ? `Online for ${durationText} • Heartbeat active` : 'Currently Offline • Hidden from search'}
        </span>
        <span className="text-gray-400 text-[11px]">Auto-synced</span>
      </div>
    </div>
  );
};

export const ProviderDashboard = () => {
  const { user, firebaseUser } = useAuth();
  const uid = firebaseUser?.uid || user?.id;
  const navigate = useNavigate();

  const { available: presenceAvailable, onlineSince, updating, toggleAvailability } = useProviderPresence(Boolean(uid));

  const [stats, setStats] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const refreshStats = () => {
    setLoadError('');
    Promise.all([
      providerPortalService.getDashboardStats(),
      providerPortalService.getEarningsTrend(7).catch(() => []),
      providerPortalService.getProviderBookings(null, 0, 50).catch(() => []),
    ])
      .then(([dashData, trend, bookingsData]) => {
        setStats(dashData);
        setTrendData(Array.isArray(trend) ? trend : []);
        const list = Array.isArray(bookingsData) ? bookingsData : (bookingsData?.content || []);
        setAllBookings(list);
        if (typeof dashData?.available === 'boolean') {
          dispatchAvailabilityChange(dashData.available);
        }
      })
      .catch((err) => {
        console.error('Failed to load dashboard stats:', err);
        setLoadError(err.response?.data?.message || 'Unable to load dashboard stats.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const handleAvailabilitySync = (e) => {
      if (typeof e.detail?.available === 'boolean') {
        setStats((prev) => (prev ? { ...prev, available: e.detail.available } : prev));
      }
    };
    window.addEventListener(PROVIDER_AVAILABILITY_EVENT, handleAvailabilitySync);
    return () => window.removeEventListener(PROVIDER_AVAILABILITY_EVENT, handleAvailabilitySync);
  }, []);

  useEffect(() => {
    if (!uid) {
      setStats(null);
      setLoading(false);
      return;
    }

    refreshStats();

    const q = query(collection(db, 'bookings'), where('providerId', '==', uid));
    const unsubscribe = onSnapshot(
      q,
      () => refreshStats(),
      (err) => console.warn('Real-time bookings trigger error on dashboard:', err)
    );
    return () => unsubscribe();
  }, [uid]);

  const handleToggle = async () => {
    try {
      const next = await toggleAvailability();
      if (typeof next === 'boolean') {
        setStats((prev) => (prev ? { ...prev, available: next } : prev));
        showToast.success(next ? 'You are now ONLINE' : 'You are now OFFLINE');
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Could not update availability.');
    }
  };

  const handleAcceptRequest = async (id) => {
    try {
      await providerPortalService.updateBookingStatus(id, 'ACCEPTED');
      showToast.success('Request accepted! Opening job screen...');
      navigate(`/jobs/${id}`);
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Accept request failed.');
    }
  };

  const handleRejectRequest = async (id) => {
    try {
      await providerPortalService.updateBookingStatus(id, 'REJECTED');
      showToast.success('Request rejected.');
      refreshStats();
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Reject request failed.');
    }
  };

  const summaryMetrics = useMemo(() => {
    const todayIso = new Date().toISOString().split('T')[0];
    const todayTrendEntry = trendData.find((d) => String(d.date || '').includes(todayIso));
    const todayEarnings =
      stats?.todayEarnings ??
      todayTrendEntry?.earnings ??
      allBookings
        .filter((b) => b.status === 'COMPLETED' && b.scheduledDate === todayIso)
        .reduce((acc, b) => acc + (Number(b.amount) || 0), 0);

    const todayJobs =
      stats?.todayJobsCount ??
      allBookings.filter(
        (b) => b.scheduledDate === todayIso && ['ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'].includes(b.status)
      ).length;

    const totalHandled = allBookings.filter((b) => b.status !== 'REQUESTED').length;
    const rejectedCount = allBookings.filter((b) => b.status === 'REJECTED').length;
    const acceptanceRate =
      stats?.acceptanceRate ??
      (totalHandled > 0 ? Math.round(((totalHandled - rejectedCount) / totalHandled) * 100) : 100);

    const ratingVal = stats?.rating && Number(stats.rating) > 0 ? Number(stats.rating).toFixed(1) : 'New';
    return { todayEarnings, todayJobs, acceptanceRate, ratingVal };
  }, [stats, trendData, allBookings]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <SkeletonCard />
        <div className="grid grid-cols-2 gap-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard />
      </div>
    );
  }

  const isOnline = typeof stats?.available === 'boolean' ? stats.available : Boolean(presenceAvailable);
  const pendingRequests = stats?.pendingRequests || [];
  const activeJobs = stats?.activeJobs || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {loadError && <ErrorState compact message={loadError} onRetry={refreshStats} />}

      {/* 1. Huge GO ONLINE / GO OFFLINE Slide-to-Toggle + Heartbeat */}
      <SlideAvailabilityButton
        available={isOnline}
        onlineSince={onlineSince}
        updating={updating}
        onToggle={handleToggle}
      />

      {/* 2. Verification Status Banner */}
      {stats?.verificationStatus === 'REJECTED' ? (
        <div className="bg-rose-500/15 border border-status-danger/40 rounded-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-status-danger shrink-0 mt-0.5" />
            <div>
              <h2 className="font-display font-bold text-ds-14 text-brand-ink dark:text-brand-white">
                Verification Rejected
              </h2>
              <p className="text-ds-12 text-gray-900 dark:text-gray-200 mt-0.5">
                {stats.verificationNotes || 'Please update your documents and profile details to resubmit.'}
              </p>
            </div>
          </div>
          <Button variant="danger" onClick={() => navigate('/profile')} className="shrink-0">
            Update &amp; Resubmit
          </Button>
        </div>
      ) : stats?.verificationStatus !== 'VERIFIED' ? (
        <div className="bg-brand-yellowSoft dark:bg-brand-yellow/10 border border-brand-yellow rounded-card p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-brand-ink dark:text-brand-yellow shrink-0" />
            <div>
              <h2 className="font-display font-bold text-ds-14 text-brand-ink dark:text-brand-white">
                Verification Pending Review
              </h2>
              <p className="text-ds-12 text-gray-900 dark:text-gray-200">
                Complete your pricing, documents, and service coverage in Profile.
              </p>
            </div>
          </div>
          <Button variant="accent" onClick={() => navigate('/profile')} className="min-h-[42px] py-2 px-3.5 text-ds-12 shrink-0">
            Profile
          </Button>
        </div>
      ) : (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-card px-4 py-3 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-ds-12 font-bold text-emerald-700 dark:text-emerald-300">
            <ShieldCheck className="w-4 h-4" strokeWidth={2.4} />
            Verified Partner • {stats?.providerName || user?.name}
          </span>
          <span className="text-ds-12 font-semibold text-gray-600 dark:text-gray-400">
            Radius: {stats?.serviceRadiusKm ?? 15} km
          </span>
        </div>
      )}

      {/* 3. Waiting New Request Card (if any) */}
      {pendingRequests.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-yellow animate-ping" />
              <h2 className="font-display font-bold text-ds-20 text-brand-ink dark:text-brand-white">
                New Request Waiting ({pendingRequests.length})
              </h2>
            </div>
            <Link to="/requests" className="text-ds-12 font-bold text-brand-ink dark:text-brand-yellow hover:underline">
              See all &rarr;
            </Link>
          </div>
          <RequestCard
            request={pendingRequests[0]}
            onOpen={(id) => navigate(`/jobs/${id}`)}
            onAccept={handleAcceptRequest}
            onReject={handleRejectRequest}
          />
        </section>
      )}

      {/* 4. Today's Summary Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-brand-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600/25 rounded-card p-4 shadow-card space-y-1.5">
          <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
            <span className="text-ds-12 font-bold">Earnings Today</span>
            <DollarSign className="w-4 h-4 text-brand-yellow" />
          </div>
          <div className="font-display font-extrabold text-ds-24 text-brand-ink dark:text-brand-yellow">
            {formatCurrency(summaryMetrics.todayEarnings)}
          </div>
        </div>

        <div className="bg-brand-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600/25 rounded-card p-4 shadow-card space-y-1.5">
          <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
            <span className="text-ds-12 font-bold">Jobs Today</span>
            <Briefcase className="w-4 h-4 text-status-info" />
          </div>
          <div className="font-display font-extrabold text-ds-24 text-brand-ink dark:text-brand-white">
            {summaryMetrics.todayJobs}
          </div>
        </div>

        <div className="bg-brand-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600/25 rounded-card p-4 shadow-card space-y-1.5">
          <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
            <span className="text-ds-12 font-bold">Acceptance Rate</span>
            <TrendingUp className="w-4 h-4 text-status-success" />
          </div>
          <div className="font-display font-extrabold text-ds-24 text-brand-ink dark:text-brand-white">
            {summaryMetrics.acceptanceRate}%
          </div>
        </div>

        <div className="bg-brand-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600/25 rounded-card p-4 shadow-card space-y-1.5">
          <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
            <span className="text-ds-12 font-bold">Partner Rating</span>
            <Star className="w-4 h-4 fill-brand-yellow text-brand-yellow" />
          </div>
          <div className="font-display font-extrabold text-ds-24 text-brand-ink dark:text-brand-white">
            {summaryMetrics.ratingVal}
          </div>
        </div>
      </section>

      {/* 5. Active Jobs & Weekly Mini Earnings Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-ds-20 text-brand-ink dark:text-brand-white">
              Active Jobs ({activeJobs.length})
            </h2>
            <Link to="/jobs" className="text-ds-12 font-bold text-brand-ink dark:text-brand-yellow hover:underline inline-flex items-center gap-1">
              All jobs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {activeJobs.length === 0 ? (
            <EmptyState
              icon={<Wrench className="w-6 h-6" />}
              title="No active jobs right now"
              description="Accept an incoming request to start navigation and OTP check-in."
              actionLabel="Check Requests"
              onAction={() => navigate('/requests')}
            />
          ) : (
            <div className="space-y-3">
              {activeJobs.slice(0, 3).map((job) => (
                <div
                  key={job.id}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  className="bg-brand-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600/25 hover:border-brand-yellow rounded-card p-4 shadow-card cursor-pointer flex items-center justify-between gap-3 transition-all"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display font-bold text-ds-16 text-brand-ink dark:text-brand-white truncate">
                        {job.serviceName}
                      </h3>
                      <StatusBadge status={job.status} />
                    </div>
                    <p className="text-ds-12 text-gray-600 dark:text-gray-200 font-semibold">
                      {job.customerName}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-600 dark:text-gray-400">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-brand-yellow" /> {job.scheduledDate} {job.scheduledTime}
                      </span>
                      <span className="inline-flex items-center gap-1 truncate max-w-[200px]">
                        <MapPin className="w-3.5 h-3.5 text-brand-yellow shrink-0" /> {job.address}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="accent"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/jobs/${job.id}`);
                    }}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    className="shrink-0"
                  >
                    Continue
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weekly Mini Earnings Chart */}
        <div className="lg:col-span-5 bg-brand-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600/25 rounded-card p-5 shadow-card flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                Weekly Earnings
              </span>
              <h2 className="font-display font-extrabold text-ds-24 text-brand-ink dark:text-brand-white mt-0.5">
                {formatCurrency(stats?.totalRealizedEarnings ?? 0)} total
              </h2>
            </div>
            <Link
              to="/earnings"
              className="px-3 py-1.5 rounded-pill bg-brand-yellowSoft dark:bg-brand-yellow/15 border border-brand-yellow text-brand-ink dark:text-brand-yellow text-ds-12 font-bold"
            >
              Details
            </Link>
          </div>

          <div className="h-40 w-full">
            {trendData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-ds-12 text-gray-400">
                Complete jobs to see daily payout bars
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9A9AA5' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B0B0F',
                      border: '1px solid #FFC700',
                      borderRadius: '10px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                    }}
                    formatter={(val) => [`₹${val}`, 'Earnings']}
                  />
                  <Bar dataKey="earnings" fill="#FFC700" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* 6. Quick Links */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Incoming Requests', to: '/requests', icon: Inbox, count: stats?.todayRequestsCount },
          { label: 'Active Jobs', to: '/jobs', icon: Wrench, count: stats?.activeJobsCount },
          { label: 'Earnings', to: '/earnings', icon: DollarSign },
          { label: 'Partner Profile', to: '/profile', icon: User },
        ].map((q) => {
          const Icon = q.icon;
          return (
            <Link
              key={q.to}
              to={q.to}
              className="bg-brand-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600/25 hover:border-brand-yellow rounded-card p-4 flex items-center gap-3 transition-colors"
            >
              <div className="w-10 h-10 rounded-card bg-brand-yellowSoft dark:bg-brand-yellow/15 text-brand-ink dark:text-brand-yellow flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <div className="font-display font-bold text-ds-12 text-brand-ink dark:text-brand-white truncate">
                  {q.label}
                </div>
                {q.count !== undefined && (
                  <div className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                    {q.count} items
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
};
