import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { providerPortalService } from '../../services/providerPortalService';
import { TrendingUp, DollarSign, Calendar } from 'lucide-react';

export const ProviderEarnings = () => {
  const { user, firebaseUser } = useAuth();
  const uid = firebaseUser?.uid || user?.id;

  const [earnings, setEarnings] = useState(0);
  const [trendData, setTrendData] = useState([]);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  const fetchEarningsData = useCallback(() => {
    providerPortalService.getEarnings().then((val) => setEarnings(val ?? 0)).catch(() => {});
    providerPortalService.getEarningsTrend(days)
      .then((data) => setTrendData(Array.isArray(data) ? data : []))
      .catch(() => setTrendData([]))
      .finally(() => setLoading(false));
  }, [days]);

  useEffect(() => {
    setLoading(true);
    fetchEarningsData();
  }, [fetchEarningsData]);

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, 'bookings'), where('providerId', '==', uid));
    const unsubscribe = onSnapshot(q, () => fetchEarningsData(), () => {});
    return () => unsubscribe();
  }, [uid, fetchEarningsData]);

  const maxDaily = Math.max(1, ...trendData.map((d) => Number(d.earnings || 0)));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-display">Realized Earnings & Analytics</h1>
        <p className="text-xs text-slate-500 mt-1">Track daily revenue trends computed from completed & paid jobs</p>
      </div>

      <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-8 shadow-panel border border-slate-800 bg-dark-grid-pattern flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Realized Revenue</span>
          <div className="text-4xl font-extrabold mt-1 text-emerald-400 font-display">₹{earnings}</div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            Calculated strictly from COMPLETED jobs with payment_status = PAID
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-md border border-slate-700/60">
          <Calendar className="w-4 h-4 text-slate-400 ml-1" />
          <button
            onClick={() => setDays(7)}
            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${days === 7 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:text-white'}`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setDays(30)}
            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${days === 30 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:text-white'}`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h2 className="font-display font-bold text-base text-slate-900">Earnings Trend ({days} Days)</h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">Continuous daily query</span>
        </div>

        {loading ? (
          <div className="h-48 bg-slate-100 rounded-lg animate-pulse"></div>
        ) : trendData.length === 0 ? (
          <p className="text-xs text-slate-500 py-8 text-center">No earnings data available yet.</p>
        ) : (
          <div className="space-y-2.5 pt-2">
            {trendData.map((item, idx) => {
              const val = Number(item.earnings || 0);
              const pct = Math.round((val / maxDaily) * 100);
              return (
                <div key={item.date || idx} className="grid grid-cols-12 items-center gap-3 text-xs">
                  <span className="col-span-3 sm:col-span-2 font-medium text-slate-600">{item.date || item.day}</span>
                  <div className="col-span-6 sm:col-span-8 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${val > 0 ? Math.max(4, pct) : 0}%` }} />
                  </div>
                  <span className="col-span-3 sm:col-span-2 text-right font-bold text-slate-900">₹{val}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
