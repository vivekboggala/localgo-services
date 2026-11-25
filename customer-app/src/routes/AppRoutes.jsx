import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { CustomerLayout } from '../layouts/CustomerLayout';

import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { SignupPage } from '../pages/SignupPage';

import { ServiceListPage } from '../pages/customer/ServiceListPage';
import { CustomerDashboard } from '../pages/customer/CustomerDashboard';
import { NearbyProvidersPage } from '../pages/customer/NearbyProvidersPage';
import { MapPage } from '../pages/customer/MapPage';
import { ProviderDetailPage } from '../pages/customer/ProviderDetailPage';
import { BookingFlow } from '../pages/customer/BookingFlow';
import { MyBookingsPage } from '../pages/customer/MyBookingsPage';
import { BookingDetailPage } from '../pages/customer/BookingDetailPage';
import { NotificationsPage } from '../pages/customer/NotificationsPage';
import ProfilePage from '../pages/customer/ProfilePage';
import VerifyEmailPage from '../pages/auth/VerifyEmailPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';

import { ProtectedRoute } from '../components/common/ProtectedRoute';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/services" element={<ServiceListPage />} />
      </Route>

      <Route element={<CustomerLayout />}>
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><CustomerDashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/providers" element={<NearbyProvidersPage />} />
        <Route path="/providers/nearby" element={<NearbyProvidersPage />} />
        <Route path="/providers/:id" element={<ProviderDetailPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/book/:providerId" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><BookingFlow /></ProtectedRoute>} />
        <Route path="/my-bookings" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><MyBookingsPage /></ProtectedRoute>} />
        <Route path="/bookings" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><MyBookingsPage /></ProtectedRoute>} />
        <Route path="/bookings/:id" element={<ProtectedRoute><BookingDetailPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route path="*" element={
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
          <p className="text-gray-500 mb-4">Page not found</p>
          <a href="/" className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-xl">Go Home</a>
        </div>
      } />
    </Routes>
  );
};
