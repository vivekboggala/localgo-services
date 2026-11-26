import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../ui';

export const Footer = () => {
  return (
    <footer className="bg-brand-ink text-gray-400 pt-12 pb-24 md:pb-10 border-t border-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
        <div className="space-y-3">
          <Logo variant="dark" size="sm" subtitle="On-Demand Marketplace" />
          <p className="text-ds-12 text-gray-400 leading-relaxed max-w-xs">
            Verified doorstep home professionals with live tracking, OTP-verified start, and transparent upfront pricing.
          </p>
        </div>

        <div>
          <h4 className="text-brand-white font-display font-bold text-ds-12 uppercase tracking-wider mb-3">
            Popular Services
          </h4>
          <ul className="space-y-2 text-ds-12">
            <li><Link to="/services" className="hover:text-brand-yellow transition-colors">AC &amp; Appliance Repair</Link></li>
            <li><Link to="/services" className="hover:text-brand-yellow transition-colors">Electricians &amp; Wiring</Link></li>
            <li><Link to="/services" className="hover:text-brand-yellow transition-colors">Plumbing &amp; Leakage</Link></li>
            <li><Link to="/services" className="hover:text-brand-yellow transition-colors">Home Deep Cleaning</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-brand-white font-display font-bold text-ds-12 uppercase tracking-wider mb-3">
            Customer Links
          </h4>
          <ul className="space-y-2 text-ds-12">
            <li><Link to="/providers" className="hover:text-brand-yellow transition-colors">Find Nearby Pros</Link></li>
            <li><Link to="/map" className="hover:text-brand-yellow transition-colors">Live Service Map</Link></li>
            <li><Link to="/my-bookings" className="hover:text-brand-yellow transition-colors">Track Bookings</Link></li>
            <li><Link to="/favorites" className="hover:text-brand-yellow transition-colors">Saved Favorites</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-brand-white font-display font-bold text-ds-12 uppercase tracking-wider mb-3">
            Account &amp; Partner
          </h4>
          <ul className="space-y-2 text-ds-12">
            <li><Link to="/login" className="hover:text-brand-yellow transition-colors">Customer Sign In</Link></li>
            <li><Link to="/signup" className="hover:text-brand-yellow transition-colors">Create Account</Link></li>
            <li>
              <a
                href={import.meta.env.VITE_PROVIDER_APP_URL || 'http://localhost:5174'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-yellow font-semibold hover:underline"
              >
                Become a Provider &rarr;
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-gray-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-ds-12 text-gray-400">
        <span>&copy; {new Date().getFullYear()} LocalGo Services. All rights reserved.</span>
        <span>OTP-secured arrival &bull; Verified professionals</span>
      </div>
    </footer>
  );
};
