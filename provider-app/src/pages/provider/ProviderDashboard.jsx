import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
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
  Eye,
} from 'lucide-react';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
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
    <div className="space-y-2.5">
      <div
        ref={trackRef}
        className={`relative h-[64px] rounded-sheet p-1.5 border-2 overflow-hidden select-none transition-colors duration-200 shadow-sheet flex items-center ${
          available
            ? 'bg-status-success border-emerald-400 text-brand-white'
            : 'bg-brand-ink border-brand-yellow text-brand-white'
        }`}
      >
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
          className={`relative z-10 w-12 h-12 rounded-card flex items-center justify-center shadow-panel transition-transform duration-150 shrink-0 cursor-grab active:cursor-grabbing ${
            available ? 'bg-brand-white text-status-success' : 'bg-brand-yellow text-brand-ink'
          }`}
        >
          {updating ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <ChevronsRight className="w-6 h-6" strokeWidth={2.5} />
          )}
        </button>

        <button
          type="button"
          onClick={onToggle}
          disabled={updating}
          className="flex-1 h-full flex flex-col items-center justify-center px-3 text-center cursor-pointer"
        >
          <span className="font-display font-extrabold text-ds-16 tracking-tight uppercase">
            {updating ? 'Updating...' : available ? 'GO OFFLINE' : 'GO ONLINE'}
          </span>
          <span className={`text-[11px] font-semibold ${available ? 'text-emerald-100' : 'text-brand-yellow'}`}>
            {available ? 'Tap to pause dispatch' : 'Tap to receive bookings'}
          </span>
        </button>

        <div className="w-8 flex items-center justify-center opacity-80 pr-2 pointer-events-none">
          <Power className="w-4 h-4" strokeWidth={2.2} />
        </div>
      </div>

      <div className="flex items-center justify-between px-1 text-ds-12 font-semibold">
        <span className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-200">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              available ? 'bg-status-success animate-pulse' : 'bg-gray-400'
            }`}
          />
          {available ? `Online for ${durationText}` : 'Currently Offline'}
        </span>
        <span className="text-gray-600 dark:text-gray-400 text-[11px]">Heartbeat synced</span>
      </div>
    </div>
  );
};

export const ProviderDashboard = () => {
  const { user, firebaseUser } = useAuth();
  const { isDark } = useTheme();
  const uid = firebaseUser?.uid || user?.id;
  const navigate = useNavigate();

  const { available: presenceAvailable, onlineSince, updating, toggleAvailability } = useProviderPresence(Boolean(uid));

  const [stats, setStats] = useState(null);
  const [chartDays, setChartDays] = useState(7);
  const [trendData, setTrendData] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const refreshStats = (daysArg = chartDays) => {
    setLoadError('');
    Promise.all([
      providerPortalService.getDashboardStats(),
      providerPortalService.getEarningsTrend(daysArg).catch(() => []),
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
    if (!uid) return;
    providerPortalService.getEarningsTrend(chartDays)
      .then((trend) => setTrendData(Array.isArray(trend) ? trend : []))
      .catch(() => {});
  }, [chartDays, uid]);

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

    refreshStats(chartDays);

    const q = query(collection(db, 'bookings'), where('providerId', '==', uid));
    const unsubscribe = onSnapshot(
      q,
      () => refreshStats(chartDays),
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
    const now = new Date();
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const toLocalDateStr = (val) => {
      if (!val) return '';
      if (typeof val === 'string') {
        const s = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(val.trim()) ? val.trim() : `${val.trim()}Z`;
        const d = new Date(s);
        if (!isNaN(d.getTime())) {
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
      }
      return '';
    };
    const getTotal = (b) =>
      b.totalAmount != null ? Number(b.totalAmount) : Number(b.amount || 0) + Number(b.extraAmount || 0);

    const todayTrendEntry = trendData.find((d) => String(d.date || '').includes(todayIso));
    const localTodayPaidEarnings = allBookings
      .filter((b) => {
        if (b.status !== 'COMPLETED' || b.paymentStatus !== 'PAID') return false;
        const doneDate = toLocalDateStr(b.completedAt) || b.scheduledDate;
        return doneDate === todayIso;
      })
      .reduce((acc, b) => acc + getTotal(b), 0);

    const todayEarnings =
      stats?.todayEarnings ??
      (Number(todayTrendEntry?.earnings || 0) > 0 ? Number(todayTrendEntry.earnings) : localTodayPaidEarnings);

    const todayJobs =
      stats?.todayJobsCount ??
      allBookings.filter(
        (b) =>
          (toLocalDateStr(b.completedAt) === todayIso || b.scheduledDate === todayIso) &&
          ['ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'].includes(b.status)
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
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard />
      </div>
    );
  }

  const isOnline = typeof stats?.available === 'boolean' ? stats.available : Boolean(presenceAvailable);
  const pendingRequests = stats?.pendingRequests || [];
  const recentJobs = allBookings.slice(0, 6);

  return (
    <div className="space-y-6">
      {loadError && <ErrorState compact message={loadError} onRetry={() => refreshStats()} />}

      {/* 1. Top Row: 4 KPI Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-brand-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600/25 rounded-card p-5 shadow-card space-y-2">
          <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
            <span className="text-ds-12 font-bold">Earnings Today</span>
            <DollarSign className="w-4 h-4 text-brand-yellow" />
          </div>
          <div className="font-display font-extrabold text-ds-24 sm:text-ds-32 text-brand-ink dark:text-brand-yellow">
            {formatCurrency(summaryMetrics.todayEarnings)}
          </div>
        </div>

        <div className="bg-brand-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600/25 rounded-card p-5 shadow-card space-y-2">
          <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
            <span className="text-ds-12 font-bold">Jobs Today</span>
            <Briefcase className="w-4 h-4 text-status-info" />
          </div>
          <div className="font-display font-extrabold text-ds-24 sm:text-ds-32 text-brand-ink dark:text-brand-white">
            {summaryMetrics.todayJobs}
          </div>
        </div>

        <div className="bg-brand-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600/25 rounded-card p-5 shadow-card space-y-2">
          <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
            <span className="text-ds-12 font-bold">Acceptance Rate</span>
            <TrendingUp className="w-4 h-4 text-status-success" />
          </div>
          <div className="font-display font-extrabold text-ds-24 sm:text-ds-32 text-brand-ink dark:text-brand-white">
            {summaryMetrics.acceptanceRate}%
          </div>
        </div>

        <div className="bg-brand-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600/25 rounded-card p-5 shadow-card space-y-2">
          <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
            <span className="text-ds-12 font-bold">Partner Rating</span>
            <Star className="w-4 h-4 fill-brand-yellow text-brand-yellow" />
          </div>
          <div className="font-display font-extrabold text-ds-24 sm:text-ds-32 text-brand-ink dark:text-brand-white">
            {summaryMetrics.ratingVal}
          </div>
        </div>
      </section>

      {/* 2. Two-Column Dashboard Split: Left (8 cols) Chart + Recent Jobs, Right (4 cols) Duty + Verification + Pending */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Earnings Chart Card with 7d / 30d Toggle */}
          <div className="bg-brand-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600/25 rounded-card p-6 shadow-card space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 block">
                  Realized Revenue Trend
                </span>
                <h2 className="font-display font-extrabold text-ds-24 text-brand-ink dark:text-brand-white mt-0.5">
                  {formatCurrency(stats?.totalRealizedEarnings ?? 0)} lifetime
                </h2>
              </div>

              <div className="inline-flex items-center bg-gray-100 dark:bg-brand-ink p-1 rounded-pill border border-gray-200 dark:border-gray-600/35 self-start">
                {[7, 30].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setChartDays(d)}
                    className={`px-3.5 py-1.5 rounded-pill text-ds-12 font-bold transition-colors cursor-pointer ${
                      chartDays === d
                        ? 'bg-brand-yellow text-brand-ink shadow-card'
                        : 'text-gray-600 dark:text-gray-400 hover:text-brand-ink dark:hover:text-brand-white'
                    }`}
                  >
                    {d} Days
                  </button>
                ))}
              </div>
            </div>

            <div className="h-60 w-full">
              {trendData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-ds-12 text-gray-600 dark:text-gray-400">
                  Complete jobs to see daily payout bars
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#2a2a33' : '#EEEEF0'} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: isDark ? '#9A9AA5' : '#5B5B66' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: isDark ? '#9A9AA5' : '#5B5B66' }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip
                      contentStyle={
                        isDark
                          ? {
                              backgroundColor: '#0B0B0F',
                              border: '1px solid #FFC700',
                              borderRadius: '10px',
                              color: '#FFFFFF',
                              fontSize: '12px',
                            }
                          : {
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #0B0B0F',
                              borderRadius: '10px',
                              color: '#0B0B0F',
                              fontSize: '12px',
                            }
                      }
                      formatter={(val) => [`₹${val}`, 'Earnings']}
                    />
                    <Bar dataKey="earnings" fill={isDark ? '#FFC700' : '#0B0B0F'} radius={[6, 6, 0, 0]} maxBarSize={42} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Recent Jobs Table */}
          <div className="bg-brand-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600/25 rounded-card shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-600/20 flex items-center justify-between">
              <h2 className="font-display font-bold text-ds-16 text-brand-ink dark:text-brand-white">
                Recent Jobs
              </h2>
              <Link
                to="/bookings"
                className="text-ds-12 font-bold text-brand-ink dark:text-brand-yellow hover:underline inline-flex items-center gap-1"
              >
                Full History <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentJobs.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={<Briefcase className="w-6 h-6" />}
                  title="No jobs recorded yet"
                  description="Go online and accept incoming customer requests to build your history."
                  actionLabel="View Requests"
                  onAction={() => navigate('/requests')}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 dark:bg-brand-ink/70 border-b border-gray-200 dark:border-gray-600/20">
                    <tr className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      <th className="py-3 px-5">Service</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-600/20 text-ds-12">
                    {recentJobs.map((job) => (
                      <tr
                        key={job.id}
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        className="hover:bg-gray-50 dark:hover:bg-brand-ink/50 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-5 font-display font-bold text-brand-ink dark:text-brand-white">
                          {job.serviceName}
                        </td>
                        <td className="py-3.5 px-4 text-gray-600 dark:text-gray-200">{job.customerName}</td>
                        <td className="py-3.5 px-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {job.scheduledDate} {job.scheduledTime}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={job.status} />
                        </td>
                        <td className="py-3.5 px-4 text-right font-display font-bold text-brand-ink dark:text-brand-yellow whitespace-nowrap">
                          {formatCurrency(job.amount)}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/jobs/${job.id}`);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-card bg-gray-100 dark:bg-brand-ink text-brand-ink dark:text-brand-white font-bold hover:border-brand-yellow border border-transparent cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> Open
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT (4 Cols): Duty Card, Verification Banner, Newest Pending Request */}
        <aside className="lg:col-span-4 space-y-5">
          {/* Duty Control Card */}
          <div className="bg-brand-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600/25 rounded-card p-5 shadow-card space-y-3">
            <h2 className="font-display font-bold text-ds-16 text-brand-ink dark:text-brand-white">
              Dispatch Duty Status
            </h2>
            <SlideAvailabilityButton
              available={isOnline}
              onlineSince={onlineSince}
              updating={updating}
              onToggle={handleToggle}
            />
          </div>

          {/* Verification Status Banner */}
          {stats?.verificationStatus === 'REJECTED' ? (
            <div className="bg-rose-500/15 border border-status-danger/40 rounded-card p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-status-danger shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-display font-bold text-ds-14 text-brand-ink dark:text-brand-white">
                    Verification Rejected
                  </h2>
                  <p className="text-ds-12 text-gray-900 dark:text-gray-200 mt-0.5">
                    {stats.verificationNotes || 'Please update your documents and profile details to resubmit.'}
                  </p>
                </div>
              </div>
              <Button variant="danger" fullWidth onClick={() => navigate('/profile')}>
                Update &amp; Resubmit
              </Button>
            </div>
          ) : stats?.verificationStatus !== 'VERIFIED' ? (
            <div className="bg-brand-yellowSoft dark:bg-brand-yellow/10 border border-brand-yellow rounded-card p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-brand-ink dark:text-brand-yellow shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-display font-bold text-ds-14 text-brand-ink dark:text-brand-white">
                    Verification Pending Review
                  </h2>
                  <p className="text-ds-12 text-gray-900 dark:text-gray-200 mt-0.5">
                    Complete your pricing, documents, and service coverage in Profile.
                  </p>
                </div>
              </div>
              <Button variant="accent" fullWidth onClick={() => navigate('/profile')}>
                Complete Partner Profile
              </Button>
            </div>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-card p-4 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 text-ds-12 font-bold text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="w-4 h-4" strokeWidth={2.4} />
                Verified Partner
              </span>
              <span className="text-ds-12 font-semibold text-gray-600 dark:text-gray-400">
                {stats?.serviceRadiusKm ?? 15} km radius
              </span>
            </div>
          )}

          {/* Newest Pending Request */}
          {pendingRequests.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-yellow animate-ping" />
                  <h2 className="font-display font-bold text-ds-16 text-brand-ink dark:text-brand-white">
                    New Request ({pendingRequests.length})
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
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
