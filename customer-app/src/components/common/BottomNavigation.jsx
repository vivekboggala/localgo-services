import React from 'react';
import { Home, Wrench, Calendar, Heart, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { BottomNav } from '../ui';

export const BottomNavigation = () => {
  const { isAuthenticated } = useAuth();

  const items = [
    { key: 'home', label: 'Home', icon: Home, to: isAuthenticated ? '/dashboard' : '/' },
    { key: 'services', label: 'Services', icon: Wrench, to: '/services' },
    { key: 'bookings', label: 'Bookings', icon: Calendar, to: '/my-bookings' },
    { key: 'favorites', label: 'Favorites', icon: Heart, to: '/favorites' },
    { key: 'profile', label: 'Profile', icon: User, to: '/profile' },
  ];

  return (
    <div className="md:hidden">
      <BottomNav items={items} fixed={true} />
    </div>
  );
};
