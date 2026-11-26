import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, KeyRound, Navigation, Star } from 'lucide-react';
import { Logo } from '../ui';

const HIGHLIGHTS = [
  { icon: ShieldCheck, title: 'Verified Professionals', desc: 'ID-checked technicians at your door' },
  { icon: KeyRound, title: 'OTP-Secured Arrival', desc: '4-digit code confirms start of work' },
  { icon: Navigation, title: 'Live GPS Tracking', desc: 'Watch your pro approach in real time' },
];

export const AuthSplitLayout = ({ children, badgeText = 'Customer Access' }) => {
  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-brand-white grid grid-cols-1 lg:grid-cols-12">
      {/* Left Brand Panel (Desktop) */}
      <div className="hidden lg:flex lg:col-span-5 lg:h-screen bg-brand-ink text-brand-white bg-dark-grid-pattern p-8 xl:p-10 flex-col justify-between relative overflow-hidden">
        <div className="space-y-5 relative z-10">
          <Link to="/" className="inline-flex">
            <Logo variant="dark" size="md" subtitle="Doorstep Services" />
          </Link>

          <div className="space-y-3 pt-1">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-brand-yellow text-brand-ink text-ds-12 font-bold">
              {badgeText}
            </span>
            <h1 className="font-display font-bold text-[32px] xl:text-ds-40 tracking-tight leading-[1.1] text-brand-white">
              Home repairs in <span className="text-brand-yellow">minutes,</span> not days.
            </h1>
            <p className="text-ds-14 text-gray-400 leading-relaxed max-w-md">
              Trusted plumbers, electricians, AC technicians, and cleaners ready nearby with transparent upfront pricing.
            </p>
          </div>
        </div>

        <div className="space-y-3 relative z-10">
          <div className="space-y-2.5">
            {HIGHLIGHTS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex items-center gap-3 bg-gray-900/90 border border-gray-900 rounded-card p-3"
                >
                  <div className="w-9 h-9 rounded-card bg-brand-yellow text-brand-ink flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" strokeWidth={2.2} />
                  </div>
                  <div>
                    <div className="font-display font-bold text-ds-14 text-brand-white">{item.title}</div>
                    <div className="text-ds-12 text-gray-400">{item.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pt-1 text-ds-12 text-gray-400">
            <div className="flex items-center gap-0.5 text-brand-yellow">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-brand-yellow" />
              ))}
            </div>
            <span>4.8 average customer satisfaction across verified bookings</span>
          </div>
        </div>
      </div>

      {/* Right Form Column */}
      <div className="lg:col-span-7 lg:h-screen lg:overflow-y-auto flex flex-col justify-center items-center px-4 py-6 sm:px-8 bg-gray-50 lg:bg-brand-white">
        <div className="w-full max-w-md space-y-5 my-auto">
          <div className="flex lg:hidden justify-center">
            <Link to="/">
              <Logo size="md" subtitle={null} />
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthSplitLayout;
