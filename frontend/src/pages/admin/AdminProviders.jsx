import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { Check, X, Star } from 'lucide-react';

export const AdminProviders = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProviders = () => {
    setLoading(true);
    adminService.getAllProviders()
      .then((data) => setProviders(data.content || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleVerify = async (id, status) => {
    try {
      await adminService.verifyProvider(id, status);
      fetchProviders();
    } catch (err) {
      alert('Action failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Provider Oversight</h1>
        <p className="text-xs text-slate-500 mt-1">Review provider profiles and handle verification requests</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-4">Provider</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Service Area</th>
                <th className="p-4">Verification</th>
                <th className="p-4">Rating</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {providers.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 font-medium">
                  <td className="p-4">
                    <div className="font-semibold text-slate-900">{p.name}</div>
                    <div className="text-[11px] text-slate-500">{p.experienceYears} yrs exp</div>
                  </td>
                  <td className="p-4">
                    <div className="text-slate-900">{p.email}</div>
                    <div className="text-slate-500">{p.phone}</div>
                  </td>
                  <td className="p-4 text-slate-700">{p.serviceArea} ({p.serviceRadiusKm} km)</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded text-[11px] font-medium border ${
                      p.verificationStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      p.verificationStatus === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {p.verificationStatus}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-slate-900 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    {p.rating?.toFixed(1)}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVerify(p.id, 'VERIFIED')}
                        className="flex items-center gap-1 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-xs transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleVerify(p.id, 'REJECTED')}
                        className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-xs border border-slate-200 transition-colors"
                      >
                        <X className="w-3.5 h-3.5 text-slate-500" /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
