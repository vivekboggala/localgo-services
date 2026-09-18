import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Home, Search, Map, Calendar } from 'lucide-react';

export const BottomNavigation = () => {
  const { user } = useAuth();

  if (!user || user.role !== 'CUSTOMER') return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-2 px-4 z-40 flex items-center justify-around shadow-lg">
      <NavLink
        to="/dashboard"
        className={({ isActive }) => `flex flex-col items-center text-[10px] font-bold ${isActive ? 'text-blue-600' : 'text-slate-500'}`}
      >
        <Home className="w-4 h-4 mb-0.5" />
        Home
      </NavLink>

      <NavLink
        to="/services"
        className={({ isActive }) => `flex flex-col items-center text-[10px] font-bold ${isActive ? 'text-blue-600' : 'text-slate-500'}`}
      >
        <Search className="w-4 h-4 mb-0.5" />
        Catalog
      </NavLink>

      <NavLink
        to="/map"
        className={({ isActive }) => `flex flex-col items-center text-[10px] font-bold ${isActive ? 'text-blue-600' : 'text-slate-500'}`}
      >
        <Map className="w-4 h-4 mb-0.5" />
        Map
      </NavLink>

      <NavLink
        to="/my-bookings"
        className={({ isActive }) => `flex flex-col items-center text-[10px] font-bold ${isActive ? 'text-blue-600' : 'text-slate-500'}`}
      >
        <Calendar className="w-4 h-4 mb-0.5" />
        Bookings
      </NavLink>
    </div>
  );
};
