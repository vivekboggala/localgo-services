import React from 'react';
import { Wrench, Zap, Droplet, Smartphone, Laptop, Box, RefreshCw, Car, Sparkles, Paintbrush, ArrowRight } from 'lucide-react';

const iconMap = {
  Wrench,
  Zap,
  Droplet,
  Smartphone,
  Monitor: Laptop,
  Box,
  RefreshCw,
  Truck: Car,
  Sparkles,
  Paintbrush,
};

export const ServiceCard = ({ service, onClick }) => {
  const IconComponent = iconMap[service.icon] || Wrench;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-card hover:shadow-card-hover hover:border-slate-300 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
    >
      <div>
        <div className="w-10 h-10 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center mb-4 group-hover:bg-slate-900 group-hover:text-white transition-colors border border-slate-200/80 shrink-0">
          <IconComponent className="w-5 h-5" />
        </div>
        <h3 className="font-semibold text-slate-900 text-sm mb-1 group-hover:text-slate-900 transition-colors tracking-tight">
          {service.name}
        </h3>
        <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed font-normal">
          {service.description}
        </p>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-medium text-slate-500">
        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-sm text-[11px] font-semibold border border-slate-200/80">
          {service.category}
        </span>
        <span className="text-xs font-semibold text-slate-900 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
          Explore <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900" />
        </span>
      </div>
    </div>
  );
};
