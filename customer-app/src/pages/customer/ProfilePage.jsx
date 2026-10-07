import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { User, Mail, Phone, ShieldCheck } from 'lucide-react';
import ChangePasswordCard from '../../components/auth/ChangePasswordCard';

export const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Account & Profile</h1>
        <p className="text-xs text-slate-500 mt-1">Manage your personal information and security settings</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-full bg-slate-900 text-white font-bold text-xl flex items-center justify-center shadow-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user?.name || 'Customer'}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span className="capitalize">{user?.role?.toLowerCase()} Account</span>
              {user?.emailVerified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Email Address</span>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
              <Mail className="w-4 h-4 text-slate-400" />
              {user?.email}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Phone Number</span>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
              <Phone className="w-4 h-4 text-slate-400" />
              {user?.phone || 'Not provided'}
            </div>
          </div>
        </div>
      </div>

      <ChangePasswordCard />
    </div>
  );
};

export default ProfilePage;
