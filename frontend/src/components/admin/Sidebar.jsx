import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { MapPin, LayoutDashboard, Users, ShieldCheck, Layers, Calendar, Star, LogOut } from 'lucide-react';

export const Sidebar = () => {
  const { logout } = useAuth();

  const links = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Customers', icon: Users },
    { to: '/admin/providers', label: 'Providers', icon: ShieldCheck },
    { to: '/admin/services', label: 'Services', icon: Layers },
    { to: '/admin/bookings', label: 'Bookings', icon: Calendar },
    { to: '/admin/reviews', label: 'Reviews', icon: Star },
  ];

  return (
    <aside className="w-60 bg-slate-900 text-slate-300 min-h-screen flex flex-col justify-between p-4 border-r border-slate-800">
      <div>
        <Link to="/admin/dashboard" className="flex items-center gap-2.5 px-3 py-4 mb-6 border-b border-slate-800 group">
          <div className="w-8 h-8 bg-white/10 text-white rounded-md flex items-center justify-center border border-white/10 shadow-xs transition-transform group-hover:scale-105">
            <MapPin className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <span className="font-display font-extrabold text-base tracking-tight text-white">
              Local<span className="text-blue-400">Go</span>
            </span>
            <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded border border-slate-700/60 uppercase block mt-0.5">Admin Studio</span>
          </div>
        </Link>

        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-md font-semibold text-xs transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white font-bold border border-slate-700'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 text-slate-400" />
                {link.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <button
        onClick={logout}
        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-md font-semibold text-xs text-red-400 hover:bg-red-900/30 transition-colors border border-red-900/50"
      >
        <LogOut className="w-4 h-4" /> Sign Out
      </button>
    </aside>
  );
};
