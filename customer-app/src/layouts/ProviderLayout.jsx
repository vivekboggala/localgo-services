import React from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProviderPresence } from '../hooks/useProviderPresence';
import { MapPin, LayoutDashboard, Inbox, Wrench, DollarSign, User, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

export const ProviderLayout = () => {
  const { user, firebaseUser, logout } = useAuth();
  const uid = firebaseUser?.uid || user?.id;
  const { available, updating, toggleAvailability } = useProviderPresence(Boolean(uid));

  const handleHeaderToggle = async () => {
    try {
      const next = await toggleAvailability();
      if (typeof next === 'boolean') {
        toast.success(next ? 'You are now Online and visible to customers' : 'You are now Offline');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update online status.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 pb-16 md:pb-0">
      <nav className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/provider/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-white/10 text-white rounded-md flex items-center justify-center border border-white/10 shadow-xs transition-transform group-hover:scale-105">
              <MapPin className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-lg tracking-tight text-white">
                Local<span className="text-blue-400">Go</span>
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded border border-slate-700/60 uppercase">Provider Studio</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <NavLink to="/provider/dashboard" className={({ isActive }) => isActive ? 'text-white font-bold' : 'hover:text-white'}>Overview</NavLink>
            <NavLink to="/provider/requests" className={({ isActive }) => isActive ? 'text-white font-bold' : 'hover:text-white'}>Requests</NavLink>
            <NavLink to="/provider/jobs" className={({ isActive }) => isActive ? 'text-white font-bold' : 'hover:text-white'}>Active Jobs</NavLink>
            <NavLink to="/provider/bookings" className={({ isActive }) => isActive ? 'text-white font-bold' : 'hover:text-white'}>Bookings</NavLink>
            <NavLink to="/provider/earnings" className={({ isActive }) => isActive ? 'text-white font-bold' : 'hover:text-white'}>Earnings</NavLink>
            <NavLink to="/provider/profile" className={({ isActive }) => isActive ? 'text-white font-bold' : 'hover:text-white'}>Profile</NavLink>
          </div>

          <div className="flex items-center gap-2.5">
            {available !== null && (
              <button
                type="button"
                onClick={handleHeaderToggle}
                disabled={updating}
                title="Toggle online availability"
                className={`text-xs font-semibold px-3 py-1.5 rounded-md border flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60 ${
                  available
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${available ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                <span>{available ? 'On Duty • Online' : 'Off Duty • Offline'}</span>
              </button>
            )}
            <button onClick={logout} className="text-xs text-red-400 hover:text-red-300 font-semibold px-3 py-1.5 rounded-md border border-red-900/60 flex items-center gap-1.5 cursor-pointer">
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        <Outlet />
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 text-slate-400 border-t border-slate-800 py-2 px-3 z-40 flex items-center justify-around">
        <NavLink to="/provider/dashboard" className={({ isActive }) => `flex flex-col items-center text-[10px] font-bold ${isActive ? 'text-white' : ''}`}>
          <LayoutDashboard className="w-4 h-4 mb-0.5" /> Overview
        </NavLink>
        <NavLink to="/provider/requests" className={({ isActive }) => `flex flex-col items-center text-[10px] font-bold ${isActive ? 'text-white' : ''}`}>
          <Inbox className="w-4 h-4 mb-0.5" /> Requests
        </NavLink>
        <NavLink to="/provider/jobs" className={({ isActive }) => `flex flex-col items-center text-[10px] font-bold ${isActive ? 'text-white' : ''}`}>
          <Wrench className="w-4 h-4 mb-0.5" /> Jobs
        </NavLink>
        <NavLink to="/provider/earnings" className={({ isActive }) => `flex flex-col items-center text-[10px] font-bold ${isActive ? 'text-white' : ''}`}>
          <DollarSign className="w-4 h-4 mb-0.5" /> Earnings
        </NavLink>
        <NavLink to="/provider/profile" className={({ isActive }) => `flex flex-col items-center text-[10px] font-bold ${isActive ? 'text-white' : ''}`}>
          <User className="w-4 h-4 mb-0.5" /> Profile
        </NavLink>
      </div>
    </div>
  );
};
