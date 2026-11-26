import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { CustomerLayout } from '../layouts/CustomerLayout';

import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { SignupPage } from '../pages/SignupPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ErrorPage } from '../pages/ErrorPage';

import { ServiceListPage } from '../pages/customer/ServiceListPage';
import { CustomerDashboard } from '../pages/customer/CustomerDashboard';
import { NearbyProvidersPage } from '../pages/customer/NearbyProvidersPage';
import { MapPage } from '../pages/customer/MapPage';
import { ProviderDetailPage } from '../pages/customer/ProviderDetailPage';
import { BookingFlow } from '../pages/customer/BookingFlow';
import { MyBookingsPage } from '../pages/customer/MyBookingsPage';
import { BookingDetailPage } from '../pages/customer/BookingDetailPage';
import { NotificationsPage } from '../pages/customer/NotificationsPage';
import { FavoritesPage } from '../pages/customer/FavoritesPage';
import ProfilePage from '../pages/customer/ProfilePage';
import VerifyEmailPage from '../pages/auth/VerifyEmailPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import { DesignPreviewPage } from '../pages/DesignPreviewPage';

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
        <Route path="/profile" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><ProfilePage /></ProtectedRoute>} />
        <Route path="/providers" element={<NearbyProvidersPage />} />
        <Route path="/providers/nearby" element={<NearbyProvidersPage />} />
        <Route path="/providers/:id" element={<ProviderDetailPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/book/:providerId" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><BookingFlow /></ProtectedRoute>} />
        <Route path="/my-bookings" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><MyBookingsPage /></ProtectedRoute>} />
        <Route path="/bookings" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><MyBookingsPage /></ProtectedRoute>} />
        <Route path="/bookings/:id" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><BookingDetailPage /></ProtectedRoute>} />
        <Route path="/favorites" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><FavoritesPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><NotificationsPage /></ProtectedRoute>} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/design-preview" element={<DesignPreviewPage />} />
      <Route path="/error" element={<ErrorPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
