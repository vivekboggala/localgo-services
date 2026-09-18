import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { serviceService } from '../services/serviceService';
import { ServiceCard } from '../components/customer/ServiceCard';
import { Search, MapPin, ShieldCheck, Clock, ArrowRight, CheckCircle2, Activity, Zap, Star } from 'lucide-react';

export const LandingPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    serviceService.getAllServices()
      .then((data) => setServices(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/services?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="bg-slate-50/70">
      {/* Asymmetric Hero Section with Grid Background Texture */}
      <section className="bg-white border-b border-slate-200/80 py-16 lg:py-24 relative overflow-hidden bg-grid-pattern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center relative z-10">
          
          {/* Left Column: Headline & Search */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-slate-100 border border-slate-200/80 text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
              Verified Local Service Marketplace
            </div>

            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-slate-900 tracking-tight leading-[1.1]">
              On-demand local services, <br />
              <span className="text-slate-900">delivered to your doorstep.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl font-normal">
              Connect directly with verified independent professionals. Book skilled technicians for AC service, plumbing, electrical, and doorstep repairs with spatial radius tracking.
            </p>

            {/* Quick Search Form */}
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5 max-w-xl pt-2">
              <div className="relative flex-grow">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search service (e.g. AC Repair, Plumber, Electrician)..."
                  className="w-full pl-10 pr-4 py-3 rounded-md border border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none text-xs bg-white text-slate-900 font-medium shadow-xs transition-colors"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-md text-xs transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                Find Professional <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Feature Highlights Band */}
            <div className="bg-slate-50 border border-slate-200/80 shadow-card p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-semibold text-slate-700 mt-6">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Verified Credentials
              </span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Conflict Detection
              </span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Transparent Pricing
              </span>
            </div>
          </div>

          {/* Right Column: Structured Live Marketplace Matrix Card */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-7 shadow-panel border border-slate-800 space-y-5 relative overflow-hidden bg-dark-grid-pattern">
              
              {/* Header Badge & Status */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase block">LIVE MARKETPLACE</span>
                  <h3 className="text-lg font-bold text-white mt-0.5 tracking-tight">Madanapalle Coverage Zone</h3>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active
                </div>
              </div>

              {/* Activity Stats Bar */}
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 px-3 py-2 rounded-md border border-slate-700/50">
                <Activity className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span><strong className="text-white font-semibold">48 active jobs</strong> in region today • 12m avg arrival</span>
              </div>

              {/* Provider Cards Matrix */}
              <div className="space-y-3">
                <div className="bg-slate-800/80 hover:bg-slate-800 p-3.5 rounded-lg border border-slate-700/70 flex items-center justify-between transition-colors shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-slate-700 text-white flex items-center justify-center font-bold text-xs border border-slate-600 shrink-0">
                      RA
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Ravi AC Services</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" /> 1.2 km away • <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> 4.8
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-white bg-slate-700/60 px-2.5 py-1 rounded-sm border border-slate-600">₹350</span>
                </div>

                <div className="bg-slate-800/80 hover:bg-slate-800 p-3.5 rounded-lg border border-slate-700/70 flex items-center justify-between transition-colors shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-slate-700 text-white flex items-center justify-center font-bold text-xs border border-slate-600 shrink-0">
                      KE
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Kumar Electricals</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" /> 2.5 km away • <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> 4.6
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-white bg-slate-700/60 px-2.5 py-1 rounded-sm border border-slate-600">₹250</span>
                </div>

                <div className="bg-slate-800/80 hover:bg-slate-800 p-3.5 rounded-lg border border-slate-700/70 flex items-center justify-between transition-colors shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-slate-700 text-white flex items-center justify-center font-bold text-xs border border-slate-600 shrink-0">
                      TF
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">TechFix Mobiles</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" /> 0.8 km away • <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> 4.9
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-white bg-slate-700/60 px-2.5 py-1 rounded-sm border border-slate-600">₹300</span>
                </div>
              </div>

              {/* Provider CTA Footer */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Looking to offer services?</span>
                <Link to="/signup" className="text-white font-semibold hover:underline flex items-center gap-1">
                  Join as Provider <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                </Link>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Catalog Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-2xl text-slate-900 tracking-tight">Service Catalog</h2>
            <p className="text-xs text-slate-500 mt-1">Browse categories and schedule doorstep appointments</p>
          </div>
          <Link to="/services" className="text-xs font-semibold text-slate-900 hover:underline flex items-center gap-1">
            View All Categories <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-slate-200/70 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.slice(0, 8).map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onClick={() => navigate(`/services?category=${encodeURIComponent(service.name)}`)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
