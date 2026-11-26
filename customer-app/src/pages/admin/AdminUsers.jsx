import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { Users, Mail, Phone, CheckCircle2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getAllCustomers()
      .then((data) => setUsers(data?.content || []))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load users.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => roleFilter === 'ALL' || u.role === roleFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Directory</span>
          <h1 className="font-display font-bold text-2xl text-slate-900 tracking-tight">Users & Accounts</h1>
          <p className="text-xs text-slate-500 mt-1">All registered customers, service providers, and admins ({users.length} total).</p>
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 text-xs font-semibold">
          {['ALL', 'CUSTOMER', 'PROVIDER', 'ADMIN'].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                roleFilter === role ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800">No accounts found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email & Phone</th>
                <th className="p-4">Role</th>
                <th className="p-4">Email Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70">
                  <td className="p-4 font-bold text-slate-900">{u.name || 'Unnamed User'}</td>
                  <td className="p-4 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-slate-700"><Mail className="w-3.5 h-3.5 text-slate-400" /> {u.email}</div>
                    {u.phone && <div className="flex items-center gap-1.5 text-slate-500"><Phone className="w-3.5 h-3.5 text-slate-400" /> {u.phone}</div>}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                      u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      u.role === 'PROVIDER' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {u.emailVerified ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                        <Clock className="w-3.5 h-3.5" /> Unverified
                      </span>
                    )}
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
