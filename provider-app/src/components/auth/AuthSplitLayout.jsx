import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, Wallet, Navigation } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { Logo } from '../ui';

const PARTNER_PERKS = [
  { icon: Zap, title: 'Instant Dispatch Alerts', desc: 'Get nearby requests with 10-min timers' },
  { icon: Navigation, title: 'Turn-by-Turn Navigation', desc: 'One-tap Google Maps directions & OTP start' },
  { icon: Wallet, title: 'Track Realized Earnings', desc: 'Daily payouts summary & completed job logs' },
];

export const AuthSplitLayout = ({ children, badgeText = 'LocalGo Partner' }) => {
  const { isDark } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-brand-ink grid grid-cols-1 lg:grid-cols-12">
      {/* Left Brand Panel (Desktop) */}
      <div className="hidden lg:flex lg:col-span-5 bg-brand-ink text-brand-white bg-dark-grid-pattern p-10 xl:p-14 flex-col justify-between border-r border-gray-600/20">
        <div className="space-y-8">
          <Link to="/" className="inline-flex">
            <Logo variant="dark" size="lg" subtitle="Partner" />
          </Link>

          <div className="space-y-4 pt-4">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-pill bg-brand-yellow text-brand-ink text-ds-12 font-extrabold">
              <ShieldCheck className="w-4 h-4" strokeWidth={2.4} />
              {badgeText}
            </span>
            <h1 className="font-display font-bold text-ds-40 tracking-tight leading-tight text-brand-white">
              Go online. <span className="text-brand-yellow">Earn more</span> on every job.
            </h1>
            <p className="text-ds-16 text-gray-400 leading-relaxed max-w-md">
              Built for field technicians. Large outdoor controls, live request alerts, OTP-verified starts, and clear earnings tracking.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {PARTNER_PERKS.map((perk) => {
            const Icon = perk.icon;
            return (
              <div
                key={perk.title}
                className="flex items-center gap-3.5 bg-gray-900 border border-gray-600/25 rounded-card p-4"
              >
                <div className="w-11 h-11 rounded-card bg-brand-yellow text-brand-ink flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" strokeWidth={2.2} />
                </div>
                <div>
                  <div className="font-display font-bold text-ds-14 text-brand-white">{perk.title}</div>
                  <div className="text-ds-12 text-gray-400">{perk.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column */}
      <div className="lg:col-span-7 flex flex-col justify-center items-center px-4 py-8 sm:px-8 bg-gray-50 dark:bg-brand-ink">
        <div className="w-full max-w-lg space-y-6">
          <div className="flex lg:hidden justify-center">
            <Link to="/">
              <Logo variant={isDark ? 'dark' : 'light'} size="md" subtitle="Partner" />
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthSplitLayout;
