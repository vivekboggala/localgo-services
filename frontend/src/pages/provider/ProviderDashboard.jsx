import React, { useState, useEffect } from 'react';
import { providerPortalService } from '../../services/providerPortalService';
import { ShieldCheck, Inbox, Wrench, CheckCircle2, DollarSign } from 'lucide-react';

export const ProviderDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    providerPortalService.getDashboardStats()
      .then((data) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleToggleAvailability = async () => {
    try {
      const available = await providerPortalService.toggleAvailability();
      setStats((prev) => ({ ...prev, available }));
    } catch (err) {}
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Availability Toggle */}
      <div className="bg-slate-900 text-white rounded-lg p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm border border-slate-800">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Service Provider Portal</span>
          <h1 className="text-2xl font-bold mt-1 tracking-tight">Welcome back, {stats?.providerName}</h1>
          <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> {stats?.verificationStatus}</span>
            <span>•</span>
            <span>Coverage Radius: {stats?.serviceRadiusKm} km</span>
          </div>
        </div>

        <button
          onClick={handleToggleAvailability}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-xs transition-colors border ${
            stats?.available
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${stats?.available ? 'bg-emerald-200' : 'bg-rose-400'}`}></span>
          {stats?.available ? 'Available for Jobs' : 'Currently Offline'}
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Today's Requests</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{stats?.todayRequestsCount}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Active Jobs</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{stats?.activeJobsCount}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Completed Jobs</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{stats?.totalCompletedJobs}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Realized Earnings</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">₹{stats?.totalRealizedEarnings}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
