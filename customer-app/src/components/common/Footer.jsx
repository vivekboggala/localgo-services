import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Mail, ShieldCheck, Share2 } from 'lucide-react';
import { Logo } from '../ui';

export const Footer = () => {
  const providerPortalUrl = import.meta.env.VITE_PROVIDER_APP_URL || 'http://localhost:5174';
  const adminPortalUrl = import.meta.env.VITE_ADMIN_APP_URL || 'http://localhost:5175';

  return (
    <footer className="bg-brand-ink text-gray-400 pt-14 pb-24 lg:pb-10 border-t border-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
        {/* Column 1: Company */}
        <div className="space-y-3.5">
          <Logo variant="dark" size="sm" subtitle="On-Demand Marketplace" />
          <p className="text-ds-12 text-gray-400 leading-relaxed max-w-xs">
            Verified doorstep home professionals with live arrival tracking, OTP-verified start, and transparent upfront pricing.
          </p>
          <ul className="space-y-2 text-ds-12 pt-1">
            <li><Link to="/" className="hover:text-brand-yellow transition-colors">About LocalGo</Link></li>
            <li>
              <a
                href={providerPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-yellow font-semibold hover:underline"
              >
                Partner With Us (Provider App) &rarr;
              </a>
            </li>
            <li>
              <a
                href={adminPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-brand-yellow font-semibold hover:underline transition-colors"
              >
                Admin Console &rarr;
              </a>
            </li>
          </ul>
        </div>

        {/* Column 2: Services */}
        <div>
          <h4 className="text-brand-white font-display font-bold text-ds-12 uppercase tracking-wider mb-3.5">
            Services
          </h4>
          <ul className="space-y-2.5 text-ds-12">
            <li><Link to="/services?q=AC" className="hover:text-brand-yellow transition-colors">AC Repair &amp; Service</Link></li>
            <li><Link to="/services?q=Electrician" className="hover:text-brand-yellow transition-colors">Electrician</Link></li>
            <li><Link to="/services?q=Plumber" className="hover:text-brand-yellow transition-colors">Plumber</Link></li>
            <li><Link to="/services?q=Cleaning" className="hover:text-brand-yellow transition-colors">Home Cleaning</Link></li>
            <li><Link to="/services" className="text-brand-white font-semibold hover:text-brand-yellow transition-colors">All 10 Categories &rarr;</Link></li>
          </ul>
        </div>

        {/* Column 3: Support */}
        <div>
          <h4 className="text-brand-white font-display font-bold text-ds-12 uppercase tracking-wider mb-3.5">
            Support
          </h4>
          <ul className="space-y-2.5 text-ds-12">
            <li><Link to="/providers" className="hover:text-brand-yellow transition-colors">Find Nearby Pros</Link></li>
            <li><Link to="/map" className="hover:text-brand-yellow transition-colors">Live Service Map</Link></li>
            <li><Link to="/my-bookings" className="hover:text-brand-yellow transition-colors">Track Active Booking</Link></li>
            <li><Link to="/profile" className="hover:text-brand-yellow transition-colors">Safety &amp; OTP Guide</Link></li>
            <li className="inline-flex items-center gap-1.5 text-gray-400">
              <Mail className="w-3.5 h-3.5 text-brand-yellow" /> support@localgo.services
            </li>
          </ul>
        </div>

        {/* Column 4: Social */}
        <div>
          <h4 className="text-brand-white font-display font-bold text-ds-12 uppercase tracking-wider mb-3.5">
            Connect &amp; Social
          </h4>
          <p className="text-ds-12 text-gray-400 mb-3.5">
            Available across major service zones with real-time technician dispatch.
          </p>
          <div className="flex items-center gap-2.5">
            <a
              href="https://github.com/vivekboggala/localgo-services"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LocalGo Website"
              className="w-10 h-10 rounded-pill bg-gray-900 border border-gray-600/40 hover:border-brand-yellow text-brand-white hover:text-brand-yellow flex items-center justify-center transition-colors"
            >
              <Globe className="w-4 h-4" />
            </a>
            <a
              href="mailto:support@localgo.services"
              aria-label="Email LocalGo Support"
              className="w-10 h-10 rounded-pill bg-gray-900 border border-gray-600/40 hover:border-brand-yellow text-brand-white hover:text-brand-yellow flex items-center justify-center transition-colors"
            >
              <Mail className="w-4 h-4" />
            </a>
            <Link
              to="/providers"
              aria-label="Share or explore LocalGo"
              className="w-10 h-10 rounded-pill bg-gray-900 border border-gray-600/40 hover:border-brand-yellow text-brand-white hover:text-brand-yellow flex items-center justify-center transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-gray-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-ds-12 text-gray-400">
        <span>&copy; {new Date().getFullYear()} LocalGo Services. All rights reserved.</span>
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-brand-yellow" />
          OTP-secured arrival &bull; Verified professionals
        </span>
      </div>
    </footer>
  );
};
