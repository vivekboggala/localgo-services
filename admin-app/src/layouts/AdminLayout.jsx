import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { adminService } from '../services/adminService';
import { ShieldCheck, LayoutDashboard, Users, Calendar, Star, LogOut, Menu, X } from 'lucide-react';

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const loadCounts = () => {
      adminService.getDashboardStats()
        .then((data) => setPendingCount(data?.pendingVerifications || 0))
        .catch(() => {});
    };
    loadCounts();
    const handleRefresh = () => loadCounts();
    window.addEventListener('localgo:admin-refresh', handleRefresh);
    return () => window.removeEventListener('localgo:admin-refresh', handleRefresh);
  }, []);

  const links = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/providers', label: 'Verification Queue', icon: ShieldCheck, badge: pendingCount },
    { to: '/users', label: 'Users & Accounts', icon: Users },
    { to: '/bookings', label: 'All Bookings', icon: Calendar },
    { to: '/reviews', label: 'Review Moderation', icon: Star },
  ];

  const renderLinks = (onNavigate) => (
    <nav className="space-y-1">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center justify-between px-3.5 py-2.5 rounded-lg font-semibold text-xs transition-colors ${
                isActive
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-xs'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`
            }
          >
            <span className="flex items-center gap-3">
              <Icon className="w-4 h-4 shrink-0" />
              {link.label}
            </span>
            {typeof link.badge === 'number' && link.badge > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-slate-950">
                {link.badge}
              </span>
            )}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      <header className="lg:hidden bg-slate-900 text-white px-4 h-14 flex items-center justify-between border-b border-slate-800 sticky top-0 z-40">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white/10 rounded-md flex items-center justify-center border border-white/10">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <span className="font-display font-extrabold text-base">Local<span className="text-blue-400">Go</span></span>
          <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-1.5 py-0.5 rounded uppercase">Admin</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded-md text-slate-300 hover:bg-slate-800"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {mobileOpen && (
        <div className="lg:hidden bg-slate-900 text-slate-200 p-4 border-b border-slate-800 space-y-4">
          {renderLinks(() => setMobileOpen(false))}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 border border-red-900/50 hover:bg-red-950/40"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      )}

      <aside className="hidden lg:flex w-64 bg-slate-900 text-slate-300 min-h-screen flex-col justify-between p-4 border-r border-slate-800 shrink-0 sticky top-0 h-screen">
        <div>
          <Link to="/dashboard" className="flex items-center gap-2.5 px-3 py-3 mb-6 border-b border-slate-800">
            <div className="w-9 h-9 bg-white/10 text-white rounded-md flex items-center justify-center border border-white/10">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <span className="font-display font-extrabold text-base tracking-tight text-white">
                Local<span className="text-blue-400">Go</span>
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded border border-slate-700/60 uppercase block mt-0.5">
                Admin Console
              </span>
            </div>
          </Link>

          {renderLinks()}
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-800">
          <div className="px-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Signed in as</div>
            <div className="text-xs font-semibold text-white truncate">{user?.email || 'Admin'}</div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg font-semibold text-xs text-red-400 hover:bg-red-900/30 transition-colors border border-red-900/50"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
        <Outlet />
      </main>
    </div>
  );
};
