import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { BottomNavigation } from '../components/common/BottomNavigation';

export const CustomerLayout = () => {
  const { pathname } = useLocation();
  const isMapScreen = pathname === '/map';

  return (
    <div className="min-h-screen flex flex-col bg-brand-white">
      <Navbar />
      <main className={`flex-grow ${isMapScreen ? 'pb-0' : 'pb-20 lg:pb-0'}`}>
        <Outlet />
      </main>
      {!isMapScreen && <Footer />}
      <BottomNavigation />
    </div>
  );
};
