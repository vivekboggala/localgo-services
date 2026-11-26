import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  ShieldCheck,
  Clock,
  Wrench,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertTriangle,
  Activity,
  Info,
  Star,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Avatar, Badge, Button, EmptyState, ErrorState, PageHeader, SkeletonCard, StatusBadge } from '../../components/ui';

const RANGE_OPTIONS = [7, 30, 90];

const STATUS_COLORS = {
  REQUESTED: '#F59E0B',
  ACCEPTED: '#2E90FA',
  ON_THE_WAY: '#4F46E5',
  ARRIVED: '#7C3AED',
  IN_PROGRESS: '#0D9488',
  COMPLETED: '#12B76A',
  CANCELLED: '#F04438',
  REJECTED: '#9A9AA5',
  EXPIRED: '#5B5B66',
};

const USER_GROWTH_PLACEHOLDER = [
  { label: 'W1', customers: 12, providers: 4 },
  { label: 'W2', customers: 19, providers: 7 },
  { label: 'W3', customers: 27, providers: 10 },
  { label: 'W4', customers: 34, providers: 14 },
];

const computeWindowTrend = (series, key) => {
  if (!Array.isArray(series) || series.length < 2) return null;
  const mid = Math.floor(series.length / 2);
  const firstHalf = series.slice(0, mid).reduce((acc, row) => acc + (Number(row[key]) || 0), 0);
  const secondHalf = series.slice(mid).reduce((acc, row) => acc + (Number(row[key]) || 0), 0);
  if (firstHalf === 0 && secondHalf === 0) return { pct: 0, positive: true };
  if (firstHalf === 0) return { pct: 100, positive: true };
  const pct = Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
  return { pct, positive: pct >= 0 };
};

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pendingProviders, setPendingProviders] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [trends, setTrends] = useState([]);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = () => {
    setLoading(true);
    setError('');
    Promise.all([
      adminService.getDashboardStats(),
      adminService.getAllProviders('PENDING', '', 8, null).catch(() => ({ content: [] })),
      adminService.getAllBookings('ALL', 100, null).catch(() => ({ content: [] })),
      adminService.getAllReviews(10, null).catch(() => ({ content: [] })),
    ])
      .then(([overview, provData, bookData, revData]) => {
        setStats(overview);
        setPendingProviders(provData?.content || []);
        setRecentBookings(bookData?.content || []);
        setRecentReviews(revData?.content || []);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load admin overview.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    adminService.getAdminTrends(days)
      .then((data) => setTrends(Array.isArray(data) ? data : []))
      .catch(() => setTrends([]));
  }, [days]);

  const bookingsByStatus = useMemo(() => {
    const map = new Map();
    recentBookings.forEach((b) => {
      const s = b.status || 'UNKNOWN';
      map.set(s, (map.get(s) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({
      name: name.replace(/_/g, ' '),
      rawStatus: name,
      value,
      color: STATUS_COLORS[name] || '#0B0B0F',
    }));
  }, [recentBookings]);

  const bookingsByService = useMemo(() => {
    const map = new Map();
    recentBookings.forEach((b) => {
      const svc = b.serviceName || 'General';
      map.set(svc, (map.get(svc) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [recentBookings]);

  const lowRatedReviews = useMemo(
    () => recentReviews.filter((r) => Number(r.rating) <= 2 && !r.hidden),
    [recentReviews]
  );

  const activityFeed = useMemo(() => {
    const items = [
      ...recentBookings.slice(0, 6).map((b) => ({
        id: `b-${b.id}`,
        title: `${b.serviceName} booked by ${b.customerName || 'Customer'}`,
        meta: `Pro: ${b.providerName || 'Assigned'} • ₹${b.amount ?? 0}`,
        status: b.status,
        ts: new Date(b.createdAt || b.scheduledDate || 0).getTime(),
        to: '/bookings',
      })),
      ...recentReviews.slice(0, 4).map((r) => ({
        id: `r-${r.id}`,
        title: `${r.rating}★ review by ${r.customerName || 'Customer'}`,
        meta: r.comment ? `"${r.comment.slice(0, 65)}"` : 'Rating submitted',
        status: Number(r.rating) <= 2 ? 'REJECTED' : 'COMPLETED',
        ts: new Date(r.createdAt || 0).getTime(),
        to: '/reviews',
      })),
    ];
    return items.sort((a, b) => (isNaN(b.ts) ? 0 : b.ts) - (isNaN(a.ts) ? 0 : a.ts)).slice(0, 8);
  }, [recentBookings, recentReviews]);

  const bookingTrend = useMemo(() => computeWindowTrend(trends, 'bookings'), [trends]);
  const revenueTrend = useMemo(() => computeWindowTrend(trends, 'revenue'), [trends]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
        </div>
        <SkeletonCard />
      </div>
    );
  }

  if (error && !stats) {
    return <ErrorState message={error} onRetry={loadDashboard} />;
  }

  const kpiCards = [
    {
      label: 'Pending Verifications',
      value: stats?.pendingVerifications ?? 0,
      sub: 'Awaiting partner review',
      icon: Clock,
      accent: true,
      to: '/providers?status=PENDING',
      trend: null,
      placeholderLabel: 'Live queue count',
    },
    {
      label: 'Verified Providers',
      value: stats?.verifiedProviders ?? 0,
      sub: `Of ${stats?.totalProviders ?? 0} registered pros`,
      icon: ShieldCheck,
      to: '/providers?status=VERIFIED',
      trend: null,
      placeholderLabel: 'No period delta endpoint',
    },
    {
      label: 'Total Customers',
      value: stats?.totalCustomers ?? 0,
      sub: `${stats?.rejectedProviders ?? 0} rejected pros`,
      icon: Users,
      to: '/users',
      trend: null,
      placeholderLabel: 'No period delta endpoint',
    },
    {
      label: 'Active Bookings',
      value: stats?.activeBookings ?? 0,
      sub: 'In pipeline right now',
      icon: Wrench,
      to: '/bookings',
      trend: bookingTrend,
    },
    {
      label: 'Completed Jobs',
      value: stats?.completedBookings ?? 0,
      sub: `Of ${stats?.totalBookings ?? 0} lifetime bookings`,
      icon: CheckCircle2,
      to: '/bookings',
      trend: bookingTrend,
    },
    {
      label: 'Realized Revenue',
      value: `₹${stats?.totalRealizedRevenue ?? 0}`,
      sub: 'Completed & paid jobs',
      icon: DollarSign,
      dark: true,
      to: '/bookings',
      trend: revenueTrend,
    },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Operations Control"
        title="Platform Overview"
        subtitle="Monitor provider verification queue, booking throughput, and realized marketplace revenue"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {/* 7d / 30d / 90d Range Selector */}
            <div className="inline-flex items-center bg-brand-white p-1 rounded-pill border border-gray-200 shadow-card">
              {RANGE_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`px-3.5 py-1.5 rounded-pill text-ds-12 font-bold transition-colors cursor-pointer ${
                    days === d ? 'bg-brand-ink text-brand-yellow shadow-card' : 'text-gray-600 hover:text-brand-ink'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>

            <Link to="/providers?status=PENDING">
              <Button variant="accent" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Verification Queue ({stats?.pendingVerifications ?? 0})
              </Button>
            </Link>
          </div>
        }
      />

      {/* 6 KPI Cards with Trend Arrows */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const isDark = Boolean(card.dark);
          const isAccent = Boolean(card.accent);
          return (
            <Link
              key={card.label}
              to={card.to}
              className={`rounded-card p-6 border shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between gap-4 cursor-pointer ${
                isDark
                  ? 'bg-brand-ink text-brand-white border-gray-900'
                  : isAccent
                    ? 'bg-brand-yellowSoft border-brand-yellow'
                    : 'bg-brand-white border-gray-200 hover:border-brand-ink'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider block ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {card.label}
                  </span>
                  <div
                    className={`font-display font-extrabold text-ds-32 mt-1.5 ${
                      isDark ? 'text-brand-yellow' : 'text-brand-ink'
                    }`}
                  >
                    {card.value}
                  </div>
                </div>
                <div
                  className={`w-11 h-11 rounded-card flex items-center justify-center shrink-0 ${
                    isDark
                      ? 'bg-gray-900 text-brand-yellow border border-gray-600/30'
                      : isAccent
                        ? 'bg-brand-ink text-brand-yellow'
                        : 'bg-brand-yellowSoft text-brand-ink border border-brand-yellow'
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={2.2} />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-200/40 text-ds-12">
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{card.sub}</span>
                {card.trend ? (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[11px] font-bold ${
                      card.trend.positive
                        ? 'bg-emerald-50 text-status-success'
                        : 'bg-rose-50 text-status-danger'
                    }`}
                  >
                    {card.trend.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {card.trend.pct > 0 ? `+${card.trend.pct}%` : `${card.trend.pct}%`} ({days}d)
                  </span>
                ) : (
                  <span className={`text-[10px] font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {card.placeholderLabel}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </section>

      {/* 4 Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 1. Revenue Area Chart (8 Cols) */}
        <div className="lg:col-span-8 bg-brand-white rounded-card border border-gray-200 p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display font-bold text-ds-20 text-brand-ink">Revenue Trend ({days}d)</h2>
              <p className="text-ds-12 text-gray-600">Paid &amp; completed booking revenue from /admin/analytics/trends</p>
            </div>
            <Badge tone="success" dot>Live API</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="adminRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFC700" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#FFC700" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEEEF0" />
                <XAxis dataKey="date" tickFormatter={(d) => String(d).slice(5)} tick={{ fontSize: 11, fill: '#5B5B66' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#5B5B66' }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B0B0F',
                    border: '1px solid #FFC700',
                    borderRadius: '12px',
                    color: '#FFFFFF',
                    fontSize: '12px',
                  }}
                  formatter={(v) => [`₹${v}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0B0B0F" strokeWidth={2.5} fill="url(#adminRevGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Bookings-by-Status Donut (4 Cols) */}
        <div className="lg:col-span-4 bg-brand-white rounded-card border border-gray-200 p-6 shadow-card space-y-4">
          <div>
            <h2 className="font-display font-bold text-ds-20 text-brand-ink">Bookings by Status</h2>
            <p className="text-ds-12 text-gray-600">Latest {recentBookings.length} sampled bookings</p>
          </div>

          {bookingsByStatus.length === 0 ? (
            <EmptyState title="No booking data" description="Status distribution renders once bookings exist." />
          ) : (
            <>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bookingsByStatus}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={74}
                      paddingAngle={3}
                    >
                      {bookingsByStatus.map((entry) => (
                        <Cell key={entry.rawStatus} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2">
                {bookingsByStatus.map((item) => (
                  <span
                    key={item.rawStatus}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-pill bg-gray-100 text-brand-ink"
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name} ({item.value})
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 3. Bookings-by-Service Bar Chart (6 Cols) */}
        <div className="lg:col-span-6 bg-brand-white rounded-card border border-gray-200 p-6 shadow-card space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-display font-bold text-ds-20 text-brand-ink">Bookings by Service</h2>
              <p className="text-ds-12 text-gray-600">Derived from latest 100 bookings (no service aggregate endpoint)</p>
            </div>
            <Badge tone="neutral">Sampled</Badge>
          </div>

          {bookingsByService.length === 0 ? (
            <EmptyState title="No service bookings" description="Service bar breakdown appears after bookings are created." />
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookingsByService} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEEEF0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#5B5B66' }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#5B5B66' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B0B0F',
                      border: '1px solid #FFC700',
                      borderRadius: '10px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="#FFC700" radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* 4. New Users Line Chart (6 Cols - Explicitly Labeled Placeholder) */}
        <div className="lg:col-span-6 bg-brand-white rounded-card border border-gray-200 p-6 shadow-card space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-display font-bold text-ds-20 text-brand-ink">New Users Growth</h2>
              <p className="text-ds-12 text-gray-600">
                Placeholder preview &bull; totals: {stats?.totalCustomers ?? 0} customers, {stats?.totalProviders ?? 0} pros
              </p>
            </div>
            <Badge tone="warning" icon={<Info className="w-3 h-3" />}>Placeholder Data</Badge>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={USER_GROWTH_PLACEHOLDER} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEEEF0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#5B5B66' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#5B5B66' }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="customers" name="Customers (Placeholder)" stroke="#0B0B0F" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="providers" name="Providers (Placeholder)" stroke="#FFC700" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-gray-600">
            Note: No backend user sign-up time-series endpoint exists yet; chart curve is a labeled UI placeholder.
          </p>
        </div>
      </div>

      {/* Bottom Split: Needs Attention + Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Needs Attention Panel (6 Cols) */}
        <section className="lg:col-span-6 bg-brand-white rounded-card border border-gray-200 p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="font-display font-bold text-ds-16 text-brand-ink flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-status-warning" />
              Needs Attention ({pendingProviders.length + lowRatedReviews.length})
            </h2>
            <Link to="/providers?status=PENDING" className="text-ds-12 font-bold text-brand-ink hover:underline">
              Full Queue &rarr;
            </Link>
          </div>

          {lowRatedReviews.length > 0 && (
            <Link
              to="/reviews"
              className="flex items-center justify-between gap-3 p-3.5 rounded-card bg-rose-50 border border-rose-200 hover:border-status-danger transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Star className="w-4 h-4 text-status-danger fill-status-danger" />
                <span className="text-ds-12 font-bold text-brand-ink">
                  {lowRatedReviews.length} low-rated (1–2★) review(s) need moderation check
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-status-danger" />
            </Link>
          )}

          {pendingProviders.length === 0 ? (
            <EmptyState
              icon={<ShieldCheck className="w-6 h-6" />}
              title="Verification queue is clear"
              description="No pending provider applications right now."
            />
          ) : (
            <div className="divide-y divide-gray-100">
              {pendingProviders.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={p.name} size="sm" tone="yellow" />
                    <div className="min-w-0">
                      <div className="font-display font-bold text-ds-14 text-brand-ink truncate">{p.name}</div>
                      <div className="text-[11px] text-gray-600 truncate">
                        {p.email} &bull; {p.experienceYears ?? 0} yrs exp
                      </div>
                    </div>
                  </div>
                  <Link to="/providers?status=PENDING">
                    <Button variant="primary" className="min-h-[36px] py-1.5 px-3 text-ds-12">
                      Inspect
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Activity Feed (6 Cols) */}
        <section className="lg:col-span-6 bg-brand-white rounded-card border border-gray-200 p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="font-display font-bold text-ds-16 text-brand-ink flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-ink" />
              Recent Activity Feed
            </h2>
            <Link to="/bookings" className="text-ds-12 font-bold text-brand-ink hover:underline">
              All Bookings &rarr;
            </Link>
          </div>

          {activityFeed.length === 0 ? (
            <EmptyState title="No recent activity" description="Bookings and review events will stream here." />
          ) : (
            <div className="divide-y divide-gray-100">
              {activityFeed.map((item) => (
                <Link
                  key={item.id}
                  to={item.to}
                  className="py-3 flex items-start justify-between gap-3 hover:bg-gray-50 -mx-2 px-2 rounded-card transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-display font-bold text-ds-12 text-brand-ink truncate">{item.title}</div>
                    <div className="text-[11px] text-gray-600 truncate mt-0.5">{item.meta}</div>
                  </div>
                  <StatusBadge status={item.status} showDot={false} />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
