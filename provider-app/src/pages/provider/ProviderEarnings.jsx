import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Briefcase,
  DollarSign,
  Percent,
  Wallet,
  Calendar,
  ArrowUpRight,
  ArrowUpDown,
} from 'lucide-react';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { providerPortalService } from '../../services/providerPortalService';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  SkeletonCard,
  Tabs,
} from '../../components/ui';
import { formatCurrency } from '../../utils/helpers';

const PERIOD_TABS = [
  { key: '1', label: 'Today' },
  { key: '7', label: '7 Days' },
  { key: '30', label: '30 Days' },
];

export const ProviderEarnings = () => {
  const { user, firebaseUser } = useAuth();
  const { isDark } = useTheme();
  const uid = firebaseUser?.uid || user?.id;
  const navigate = useNavigate();

  const [periodKey, setPeriodKey] = useState('7');
  const [sortField, setSortField] = useState('date_desc');
  const [totalRealized, setTotalRealized] = useState(0);
  const [trendData, setTrendData] = useState([]);
  const [completedBookings, setCompletedBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const days = Number(periodKey);

  const fetchEarningsData = useCallback(() => {
    setError('');
    Promise.all([
      providerPortalService.getEarnings(),
      providerPortalService.getEarningsTrend(days === 1 ? 7 : days),
      providerPortalService.getProviderBookings(null, 0, 100),
    ])
      .then(([total, trend, bookings]) => {
        setTotalRealized(Number(total) || 0);
        setTrendData(Array.isArray(trend) ? trend : []);
        const list = Array.isArray(bookings) ? bookings : (bookings?.content || []);
        setCompletedBookings(list.filter((b) => b.status === 'COMPLETED'));
      })
      .catch((err) => {
        console.error('Failed to load earnings data:', err);
        setError(err.response?.data?.message || 'Unable to load earnings analytics.');
      })
      .finally(() => setLoading(false));
  }, [days]);

  useEffect(() => {
    setLoading(true);
    fetchEarningsData();
  }, [fetchEarningsData]);

  useEffect(() => {
    if (!uid) return undefined;
    const q = query(collection(db, 'bookings'), where('providerId', '==', uid));
    const unsubscribe = onSnapshot(q, () => fetchEarningsData(), () => {});
    return () => unsubscribe();
  }, [uid, fetchEarningsData]);

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() - (days - 1));
    cutoff.setHours(0, 0, 0, 0);

    const list = completedBookings.filter((b) => {
      const dateStr = b.scheduledDate || (b.completedAt ? String(b.completedAt).split('T')[0] : '');
      if (days === 1) return dateStr === todayStr;
      if (!dateStr) return true;
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? true : d >= cutoff;
    });

    return [...list].sort((a, b) => {
      if (sortField === 'amount_desc') return (Number(b.amount) || 0) - (Number(a.amount) || 0);
      if (sortField === 'amount_asc') return (Number(a.amount) || 0) - (Number(b.amount) || 0);
      const da = `${a.scheduledDate || ''}T${a.scheduledTime || ''}`;
      const dbStr = `${b.scheduledDate || ''}T${b.scheduledTime || ''}`;
      return sortField === 'date_asc' ? da.localeCompare(dbStr) : dbStr.localeCompare(da);
    });
  }, [completedBookings, days, sortField]);

  const stats = useMemo(() => {
    const paidList = filteredTransactions.filter((b) => b.paymentStatus === 'PAID');
    const sourceList = paidList.length > 0 ? paidList : filteredTransactions;
    const gross = sourceList.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
    const jobsCount = filteredTransactions.length;
    const avgPerJob = jobsCount > 0 ? Math.round(gross / jobsCount) : 0;
    const platformFees = 0;
    const net = gross - platformFees;
    return { gross, jobsCount, avgPerJob, platformFees, net };
  }, [filteredTransactions]);

  const chartBars = useMemo(() => {
    if (days === 1) {
      const todayIso = new Date().toISOString().split('T')[0];
      const todayPoint = trendData.find((d) => String(d.date || '').includes(todayIso));
      return todayPoint ? [todayPoint] : [{ date: 'Today', earnings: stats.gross }];
    }
    return trendData;
  }, [trendData, days, stats.gross]);

  const groupedByDate = useMemo(() => {
    const groups = new Map();
    filteredTransactions.forEach((b) => {
      const dateKey = b.scheduledDate || 'Recent';
      if (!groups.has(dateKey)) groups.set(dateKey, []);
      groups.get(dateKey).push(b);
    });
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredTransactions]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Earnings & Payouts"
        subtitle={`Lifetime realized: ${formatCurrency(totalRealized)}`}
        actions={
          <Button
            variant="secondary"
            disabled
            title="Bank withdrawal payout automation is coming soon"
            leftIcon={<Wallet className="w-4 h-4 text-brand-yellow" />}
            className="min-h-[46px] py-2 px-4 text-ds-12"
          >
            Withdraw &bull; Coming soon
          </Button>
        }
      />

      {error && <ErrorState compact message={error} onRetry={fetchEarningsData} />}

      {/* 4 Stat Cards + Period Segmented Hero */}
      <div
        className={`rounded-sheet p-6 border shadow-sheet space-y-6 ${
          isDark
            ? 'bg-gray-900 text-brand-white border-gray-600/30 bg-dark-grid-pattern'
            : 'bg-brand-white text-brand-ink border-gray-200 bg-grid-pattern'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400 block">
              {days === 1 ? "Today's Earnings" : `Last ${days} Days Earnings`}
            </span>
            <div className="font-display font-extrabold text-ds-40 text-brand-ink dark:text-brand-yellow mt-1 tracking-tight">
              {formatCurrency(stats.net)}
            </div>
            <p className="text-ds-12 text-gray-600 dark:text-gray-400 mt-1">
              Net payout after ₹0 platform fees &bull; {stats.jobsCount} completed {stats.jobsCount === 1 ? 'job' : 'jobs'}
            </p>
          </div>

          <Tabs tabs={PERIOD_TABS} activeTab={periodKey} onChange={setPeriodKey} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-gray-200 dark:border-gray-600/25">
          <div className="bg-gray-50 dark:bg-brand-ink/80 rounded-card p-4 border border-gray-200 dark:border-gray-600/25">
            <span className="text-ds-12 font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-brand-ink dark:text-brand-yellow" /> Completed Jobs
            </span>
            <div className="font-display font-bold text-ds-24 text-brand-ink dark:text-brand-white mt-1.5">
              {stats.jobsCount}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-brand-ink/80 rounded-card p-4 border border-gray-200 dark:border-gray-600/25">
            <span className="text-ds-12 font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-brand-ink dark:text-brand-yellow" /> Avg / Job
            </span>
            <div className="font-display font-bold text-ds-24 text-brand-ink dark:text-brand-white mt-1.5">
              {formatCurrency(stats.avgPerJob)}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-brand-ink/80 rounded-card p-4 border border-gray-200 dark:border-gray-600/25">
            <span className="text-ds-12 font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-status-success" /> Platform Fees
            </span>
            <div className="font-display font-bold text-ds-24 text-status-success mt-1.5">
              {formatCurrency(stats.platformFees)}
            </div>
          </div>

          <div className="bg-brand-yellowSoft dark:bg-brand-ink/80 rounded-card p-4 border border-brand-yellow dark:border-gray-600/25">
            <span className="text-ds-12 font-semibold text-brand-ink dark:text-gray-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-brand-ink dark:text-brand-yellow" /> Net Payout
            </span>
            <div className="font-display font-bold text-ds-24 text-brand-ink dark:text-brand-yellow mt-1.5">
              {formatCurrency(stats.net)}
            </div>
          </div>
        </div>
      </div>

      {/* Yellow-Bar Chart */}
      <div className="bg-brand-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600/30 rounded-card p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-ds-20 text-brand-ink dark:text-brand-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-ink dark:text-brand-yellow" />
            Daily Earnings Chart
          </h2>
          <span className="text-ds-12 text-gray-600 dark:text-gray-400 font-semibold">Paid &amp; completed</span>
        </div>

        {loading ? (
          <div className="h-72 bg-gray-200 dark:bg-brand-ink rounded-card animate-pulse" />
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartBars} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#2a2a33' : '#EEEEF0'} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: isDark ? '#9A9AA5' : '#5B5B66' }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: isDark ? '#9A9AA5' : '#5B5B66' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${v}`}
                />
                <Tooltip
                  cursor={{ fill: isDark ? 'rgba(255, 199, 0, 0.08)' : 'rgba(11, 11, 15, 0.04)' }}
                  contentStyle={
                    isDark
                      ? {
                          backgroundColor: '#0B0B0F',
                          borderRadius: '12px',
                          border: '1px solid #FFC700',
                          color: '#FFFFFF',
                          fontSize: '12px',
                          fontWeight: 700,
                        }
                      : {
                          backgroundColor: '#FFFFFF',
                          borderRadius: '12px',
                          border: '1px solid #0B0B0F',
                          color: '#0B0B0F',
                          fontSize: '12px',
                          fontWeight: 700,
                        }
                  }
                  formatter={(value) => [`₹${value}`, 'Earnings']}
                />
                <Bar dataKey="earnings" fill={isDark ? '#FFC700' : '#0B0B0F'} radius={[8, 8, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Transactions Section */}
      <section className="space-y-4">
        <h2 className="font-display font-bold text-ds-20 text-brand-ink dark:text-brand-white">
          Completed Transactions
        </h2>

        {loading ? (
          <SkeletonCard />
        ) : filteredTransactions.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-7 h-7" />}
            title="No completed jobs in this period"
            description="Switch to 30 Days or complete an assigned service to see itemized payouts."
          />
        ) : (
          <>
            {/* Mobile Grouped Date Cards (< lg) */}
            <div className="lg:hidden space-y-5">
              {groupedByDate.map(([dateStr, items]) => (
                <div key={dateStr} className="space-y-2.5">
                  <h3 className="text-ds-12 font-bold uppercase tracking-wider text-gray-400 px-1">
                    {dateStr}
                  </h3>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => navigate(`/jobs/${item.id}`)}
                        className="w-full text-left bg-brand-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600/30 hover:border-brand-yellow rounded-card p-4 flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="font-display font-bold text-ds-14 text-brand-ink dark:text-brand-white truncate">
                            {item.serviceName}
                          </div>
                          <div className="text-ds-12 text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <span>{item.customerName}</span>
                            <span>&bull;</span>
                            <Badge tone={item.paymentStatus === 'PAID' ? 'success' : 'warning'} className="py-0.5 px-2 text-[10px]">
                              {item.paymentMethod} • {item.paymentStatus || 'PENDING'}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-display font-extrabold text-ds-16 text-brand-ink dark:text-brand-yellow">
                            +{formatCurrency(item.amount)}
                          </span>
                          <ArrowUpRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Sortable Table (lg+) */}
            <div className="hidden lg:block bg-brand-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600/25 rounded-card shadow-card overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-brand-ink/80 border-b border-gray-200 dark:border-gray-600/25">
                  <tr className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <th className="py-3.5 px-5">
                      <button
                        type="button"
                        onClick={() => setSortField((s) => (s === 'date_desc' ? 'date_asc' : 'date_desc'))}
                        className="inline-flex items-center gap-1 hover:text-brand-yellow cursor-pointer"
                      >
                        Date <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3.5 px-4">Service</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Payment</th>
                    <th className="py-3.5 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => setSortField((s) => (s === 'amount_desc' ? 'amount_asc' : 'amount_desc'))}
                        className="inline-flex items-center gap-1 hover:text-brand-yellow cursor-pointer"
                      >
                        Net Amount <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-600/20 text-ds-14">
                  {filteredTransactions.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => navigate(`/jobs/${item.id}`)}
                      className="hover:bg-gray-50 dark:hover:bg-brand-ink/50 cursor-pointer transition-colors"
                    >
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="font-semibold text-brand-ink dark:text-brand-white">{item.scheduledDate}</div>
                        <div className="text-[11px] text-gray-400">{item.scheduledTime}</div>
                      </td>
                      <td className="py-4 px-4 font-display font-bold text-brand-ink dark:text-brand-white">
                        {item.serviceName}
                      </td>
                      <td className="py-4 px-4 text-gray-600 dark:text-gray-200">{item.customerName}</td>
                      <td className="py-4 px-4">
                        <Badge tone={item.paymentStatus === 'PAID' ? 'success' : 'warning'} dot>
                          {item.paymentMethod} • {item.paymentStatus || 'PENDING'}
                        </Badge>
                      </td>
                      <td className="py-4 px-5 text-right font-display font-extrabold text-brand-ink dark:text-brand-yellow whitespace-nowrap">
                        +{formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
};
