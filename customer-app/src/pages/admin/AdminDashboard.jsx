import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { Users, ShieldCheck, Clock, Wrench, CheckCircle2, DollarSign, TrendingUp, ArrowRight, XCircle } from 'lucide-react';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pendingProviders, setPendingProviders] = useState([]);
  const [trends, setTrends] = useState([]);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminService.getDashboardStats().catch(() => null),
      adminService.getAllProviders('PENDING').catch(() => ({ content: [] })),
    ])
      .then(([overview, provData]) => {
        setStats(overview);
        setPendingProviders((provData?.content || []).slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    adminService.getAdminTrends(days)
      .then((data) => setTrends(Array.isArray(data) ? data : []))
      .catch(() => setTrends([]));
  }, [days]);

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
      </div>
    );
  }

  const maxBookings = Math.max(1, ...trends.map((t) => Number(t.bookings) || 0));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Operations Control</span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">Admin Overview</h1>
          <p className="text-xs text-slate-500 mt-1">Monitor provider verification queue, active jobs, and realized platform revenue.</p>
        </div>

        <Link
          to="/admin/providers"
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2 shadow-xs"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Review Verification Queue
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <Link
          to="/admin/providers?status=PENDING"
          className="bg-amber-50/70 hover:bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-xs flex items-center justify-between transition-colors"
        >
          <div>
            <div className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Pending Verifications</div>
            <div className="text-3xl font-bold text-amber-700 mt-1">{stats?.pendingVerifications ?? 0}</div>
            <div className="text-[11px] text-amber-700/80 mt-1 font-medium">Click to inspect applicants</div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </Link>

        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verified Providers</div>
            <div className="text-3xl font-bold text-emerald-600 mt-1">{stats?.verifiedProviders ?? 0}</div>
            <div className="text-[11px] text-slate-400 mt-1">Out of {stats?.totalProviders ?? 0} total pros</div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rejected Profiles</div>
            <div className="text-3xl font-bold text-rose-600 mt-1">{stats?.rejectedProviders ?? 0}</div>
            <div className="text-[11px] text-slate-400 mt-1">{stats?.totalCustomers ?? 0} registered customers</div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Bookings</div>
            <div className="text-3xl font-bold text-blue-600 mt-1">{stats?.activeBookings ?? 0}</div>
            <div className="text-[11px] text-slate-400 mt-1">In pipeline right now</div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed Jobs</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{stats?.completedBookings ?? 0}</div>
            <div className="text-[11px] text-slate-400 mt-1">{stats?.totalBookings ?? 0} lifetime bookings</div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Realized Revenue</div>
            <div className="text-3xl font-bold text-emerald-400 mt-1 font-display">₹{stats?.totalRealizedRevenue ?? 0}</div>
            <div className="text-[11px] text-slate-400 mt-1">Completed & paid jobs</div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-slate-800 text-emerald-400 flex items-center justify-center border border-slate-700">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Bottom Split: Pending Queue Preview + Daily Booking Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600" />
              Awaiting Verification ({pendingProviders.length})
            </h2>
            <Link to="/admin/providers" className="text-xs font-semibold text-blue-600 hover:underline">
              Open Full Queue →
            </Link>
          </div>

          {pendingProviders.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500">
              All registered providers have been reviewed! No pending applications right now.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingProviders.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">{p.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {p.email} • {p.experienceYears ?? 0} yrs exp
                    </div>
                  </div>
                  <Link
                    to="/admin/providers?status=PENDING"
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-[11px] font-semibold shrink-0"
                  >
                    Inspect
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Booking Activity
            </h2>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-[11px] font-semibold">
              {[7, 14].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`px-2.5 py-1 rounded ${days === d ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-end justify-between gap-2 h-44 pt-4">
            {trends.map((point) => {
              const count = Number(point.bookings) || 0;
              const pct = Math.max(8, Math.round((count / maxBookings) * 100));
              return (
                <div key={point.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[10px] font-bold text-slate-700">{count}</span>
                  <div className="w-full max-w-[32px] bg-slate-100 rounded-t-md flex items-end h-28 overflow-hidden">
                    <div
                      style={{ height: `${pct}%` }}
                      className={`w-full rounded-t-md transition-all ${count > 0 ? 'bg-slate-900' : 'bg-slate-200'}`}
                      title={`${point.date}: ${count} bookings, ₹${point.revenue}`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">{point.date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
