import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { providerPortalService } from '../../services/providerPortalService';
import { ShieldCheck, Clock, Inbox, Wrench, CheckCircle2, DollarSign } from 'lucide-react';

export const ProviderDashboard = () => {
  const { user, firebaseUser } = useAuth();
  const uid = firebaseUser?.uid || user?.id;

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshStats = () => {
    providerPortalService.getDashboardStats()
      .then((data) => setStats(data))
      .catch((err) => console.error('Failed to load dashboard stats:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!uid) {
      setStats(null);
      setLoading(false);
      return;
    }

    refreshStats();

    const q = query(
      collection(db, 'bookings'),
      where('providerId', '==', uid)
    );

    const unsubscribe = onSnapshot(
      q,
      () => {
        refreshStats();
      },
      (err) => {
        console.warn('Real-time bookings trigger error on dashboard:', err);
      }
    );

    return () => unsubscribe();
  }, [uid]);

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
      <div className="bg-slate-900 text-white rounded-lg p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm border border-slate-800">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Service Provider Portal</span>
          <h1 className="text-2xl font-bold mt-1 tracking-tight">Welcome back, {stats?.providerName || user?.name}</h1>
          <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
            {stats?.verificationStatus === 'VERIFIED' ? (
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verified
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-300 font-medium bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                <Clock className="w-3.5 h-3.5 text-amber-300" /> Verification Pending
              </span>
            )}
            <span>•</span>
            <span>Coverage Radius: {stats?.serviceRadiusKm ?? 15} km</span>
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Today's Requests</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{stats?.todayRequestsCount ?? 0}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Active Jobs</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{stats?.activeJobsCount ?? 0}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Completed Jobs</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{stats?.totalCompletedJobs ?? 0}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Realized Earnings</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">₹{stats?.totalRealizedEarnings ?? 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
