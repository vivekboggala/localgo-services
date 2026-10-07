import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { MapPin, Search, User, LogOut, LayoutDashboard, Calendar, Wrench, ChevronDown } from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  const getDashboardPath = () => {
    if (user?.role === 'ADMIN') return '/admin/dashboard';
    if (user?.role === 'PROVIDER') return '/provider/dashboard';
    return '/dashboard';
  };

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-slate-900 rounded-md flex items-center justify-center text-white shadow-xs group-hover:bg-slate-800 transition-colors">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-extrabold text-slate-900 tracking-tight font-display">Local<span className="text-blue-600">Go</span></span>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block -mt-1">Services</span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link to="/services" className="hover:text-slate-900 transition-colors">Catalog</Link>
          <Link to="/map" className="hover:text-slate-900 transition-colors">Nearby Map</Link>
          {isAuthenticated && (
            <Link to={getDashboardPath()} className="hover:text-slate-900 transition-colors">Dashboard</Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 transition-colors">
                Sign In
              </Link>
              <Link to="/signup" className="text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-lg transition-colors">
                Get Started
              </Link>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className="w-7 h-7 bg-slate-100 text-slate-700 rounded-md flex items-center justify-center font-bold text-xs border border-slate-200">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-slate-800 hidden sm:inline">{user.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Signed in as</p>
                    <p className="font-semibold text-slate-900 truncate">{user.email}</p>
                  </div>
                  <Link to={getDashboardPath()} onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 font-medium">
                    <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" /> Dashboard
                  </Link>
                  {user.role === 'CUSTOMER' && (
                    <Link to="/my-bookings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" /> My Bookings
                    </Link>
                  )}
                  <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 font-medium border-t border-slate-100">
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
