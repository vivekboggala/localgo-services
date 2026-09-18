import React, { useState, useEffect } from 'react';
import { providerPortalService } from '../../services/providerPortalService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Calendar } from 'lucide-react';

export const ProviderEarnings = () => {
  const [earnings, setEarnings] = useState(0);
  const [trendData, setTrendData] = useState([]);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    providerPortalService.getEarnings().then((val) => setEarnings(val)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    providerPortalService.getEarningsTrend(days)
      .then((data) => setTrendData(data || []))
      .catch(() => setTrendData([]))
      .finally(() => setLoading(false));
  }, [days]);

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

      {/* Recharts Analytics Area Chart */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h2 className="font-display font-bold text-base text-slate-900">Earnings Trend ({days} Days)</h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">Continuous daily query</span>
        </div>

        {loading ? (
          <div className="h-64 bg-slate-100 rounded-lg animate-pulse"></div>
        ) : (
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                  formatter={(value) => [`₹${value}`, 'Earnings']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area type="monotone" dataKey="earnings" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEarnings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
