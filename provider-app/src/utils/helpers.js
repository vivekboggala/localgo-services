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

export const parseFirestoreDate = (val) => {
  if (!val) return null;
  try {
    const d =
      typeof val?.toDate === 'function'
        ? val.toDate()
        : val?.seconds != null
          ? new Date(val.seconds * 1000)
          : new Date(val);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

export const getServiceIconComponent = (serviceName = '') => {
  const text = String(serviceName || '').toLowerCase();
  if (text.includes('ac') || text.includes('cool') || text.includes('fan')) return Wind;
  if (text.includes('electr') || text.includes('wire')) return Zap;
  if (text.includes('plumb') || text.includes('pipe') || text.includes('water')) return Droplet;
  if (text.includes('clean') || text.includes('pest')) return Sparkles;
  if (text.includes('paint')) return Paintbrush;
  if (text.includes('carpent') || text.includes('wood') || text.includes('furniture')) return Hammer;
  if (text.includes('phone') || text.includes('mobile')) return Smartphone;
  if (text.includes('laptop') || text.includes('pc')) return Laptop;
  if (text.includes('applian') || text.includes('wash') || text.includes('fridge')) return RefreshCw;
  if (text.includes('move') || text.includes('shift') || text.includes('auto')) return Car;
  if (text.includes('box')) return Box;
  return Wrench;
};

export const getCustomerFirstName = (fullName = '') => {
  const clean = String(fullName || '').trim();
  if (!clean) return 'Customer';
  return clean.split(/\s+/)[0];
};
