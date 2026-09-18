import React from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { MapPin, LayoutDashboard, Inbox, Wrench, DollarSign, User, LogOut } from 'lucide-react';

export const ProviderLayout = () => {
  const { logout } = useAuth();

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
            <NavLink to="/provider/earnings" className={({ isActive }) => isActive ? 'text-white font-bold' : 'hover:text-white'}>Earnings</NavLink>
            <NavLink to="/provider/profile" className={({ isActive }) => isActive ? 'text-white font-bold' : 'hover:text-white'}>Profile</NavLink>
          </div>

          <button onClick={logout} className="text-xs text-red-400 hover:text-red-300 font-semibold px-3 py-1.5 rounded-md border border-red-900/60 flex items-center gap-1.5">
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
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
