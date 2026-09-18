import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 pt-12 pb-8 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-white/10 text-white rounded-md flex items-center justify-center border border-white/20">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-extrabold text-white tracking-tight font-display">Local<span className="text-blue-400">Go</span> <span className="text-xs font-medium text-slate-400">Services</span></span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Commercial-grade local service marketplace for verified doorstep professionals.
          </p>
        </div>

        <div>
          <h4 className="text-white font-semibold text-xs mb-3 uppercase tracking-wider">Services</h4>
          <ul className="space-y-2">
            <li><Link to="/services" className="hover:text-white transition-colors">AC & Appliance Repair</Link></li>
            <li><Link to="/services" className="hover:text-white transition-colors">Electrical Works</Link></li>
            <li><Link to="/services" className="hover:text-white transition-colors">Plumbing Fixes</Link></li>
            <li><Link to="/services" className="hover:text-white transition-colors">Gadget & PC Repair</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold text-xs mb-3 uppercase tracking-wider">Navigation</h4>
          <ul className="space-y-2">
            <li><Link to="/services" className="hover:text-white transition-colors">Service Catalog</Link></li>
            <li><Link to="/map" className="hover:text-white transition-colors">Interactive Map</Link></li>
            <li><Link to="/signup" className="hover:text-white transition-colors">Provider Portal Registration</Link></li>
            <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold text-xs mb-3 uppercase tracking-wider">Geographic Coverage</h4>
          <p className="text-slate-400 mb-2">Madanapalle Region & Surrounding Municipalities</p>
          <p className="text-[11px] text-slate-500">Haversine spatial algorithm with OpenStreetMap tile rendering.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800 pt-6 text-center text-[11px] text-slate-500">
        &copy; {new Date().getFullYear()} LocalGo Services Marketplace. All rights reserved.
      </div>
    </footer>
  );
};
