import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { BottomNavigation } from '../components/common/BottomNavigation';

export const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-brand-white">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <BottomNavigation />
    </div>
  );
};
