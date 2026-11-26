import {
  Wrench,
  Zap,
  Droplet,
  Smartphone,
  Laptop,
  Box,
  RefreshCw,
  Car,
  Sparkles,
  Paintbrush,
  Wind,
  Hammer,
  ShieldCheck,
} from 'lucide-react';

export const getProviderAvatar = (name) => {
  if (!name) return `https://api.dicebear.com/7.x/avataaars/svg?seed=provider`;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
};

export const formatRelativeTime = (dateString) => {
  if (!dateString) return 'recently';
  const date = new Date(dateString);
  const now = new Date();
  if (isNaN(date.getTime())) return 'recently';
  const diffInSeconds = Math.max(0, Math.floor((now - date) / 1000));

  if (diffInSeconds < 60) return 'just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hr ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} days ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} months ago`;
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} yrs ago`;
};

export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '₹0';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
};

const SERVICE_ICON_MAP = {
  Wrench,
  Zap,
  Droplet,
  Smartphone,
  Monitor: Laptop,
  Laptop,
  Box,
  RefreshCw,
  Truck: Car,
  Car,
  Sparkles,
  Paintbrush,
  Wind,
  Hammer,
  ShieldCheck,
};

export const getServiceIconComponent = (service) => {
  if (!service) return Wrench;
  if (service.icon && SERVICE_ICON_MAP[service.icon]) {
    return SERVICE_ICON_MAP[service.icon];
  }
  const text = `${service.name || ''} ${service.category || ''}`.toLowerCase();
  if (text.includes('ac') || text.includes('cool') || text.includes('fan')) return Wind;
  if (text.includes('electr') || text.includes('wire')) return Zap;
  if (text.includes('plumb') || text.includes('pipe') || text.includes('water')) return Droplet;
  if (text.includes('clean') || text.includes('pest')) return Sparkles;
  if (text.includes('paint')) return Paintbrush;
  if (text.includes('carpent') || text.includes('wood') || text.includes('furniture')) return Hammer;
  if (text.includes('phone') || text.includes('mobile')) return Smartphone;
  if (text.includes('laptop') || text.includes('pc') || text.includes('computer')) return Laptop;
  if (text.includes('applian') || text.includes('wash') || text.includes('fridge')) return RefreshCw;
  if (text.includes('move') || text.includes('shift') || text.includes('auto')) return Car;
  return Wrench;
};

export const getServiceStartingPrice = (service) => {
  if (!service) return 199;
  const raw = service.startingPrice ?? service.basePrice ?? service.minPrice ?? service.price;
  if (raw !== undefined && raw !== null && Number(raw) > 0) return Number(raw);
  const name = `${service.name || ''} ${service.category || ''}`.toLowerCase();
  if (name.includes('ac')) return 399;
  if (name.includes('clean')) return 499;
  if (name.includes('paint')) return 699;
  if (name.includes('plumb')) return 199;
  if (name.includes('electr')) return 199;
  if (name.includes('carpent')) return 249;
  if (name.includes('wash') || name.includes('applian')) return 299;
  return 249;
};
