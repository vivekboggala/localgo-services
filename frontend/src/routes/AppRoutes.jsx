import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { CustomerLayout } from '../layouts/CustomerLayout';
import { ProviderLayout } from '../layouts/ProviderLayout';
import { AdminLayout } from '../layouts/AdminLayout';

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

import { ProviderDashboard } from '../pages/provider/ProviderDashboard';
import { ProviderRequests } from '../pages/provider/ProviderRequests';
import { ProviderActiveJob } from '../pages/provider/ProviderActiveJob';
import { ProviderBookings } from '../pages/provider/ProviderBookings';
import { ProviderEarnings } from '../pages/provider/ProviderEarnings';
import { ProviderProfile } from '../pages/provider/ProviderProfile';

import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AdminUsers } from '../pages/admin/AdminUsers';
import { AdminProviders } from '../pages/admin/AdminProviders';
import { AdminServices } from '../pages/admin/AdminServices';
import { AdminBookings } from '../pages/admin/AdminBookings';
import { AdminReviews } from '../pages/admin/AdminReviews';

import { ProtectedRoute } from '../components/common/ProtectedRoute';

import VerifyEmailPage from '../pages/auth/VerifyEmailPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ProfilePage from '../pages/customer/ProfilePage';

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
        <Route path="/providers/nearby" element={<NearbyProvidersPage />} />
        <Route path="/providers/:id" element={<ProviderDetailPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/book/:providerId" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><BookingFlow /></ProtectedRoute>} />
        <Route path="/my-bookings" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><MyBookingsPage /></ProtectedRoute>} />
        <Route path="/bookings/:id" element={<ProtectedRoute><BookingDetailPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      </Route>

      <Route element={<ProviderLayout />}>
        <Route path="/provider/dashboard" element={<ProtectedRoute allowedRoles={['PROVIDER']}><ProviderDashboard /></ProtectedRoute>} />
        <Route path="/provider/requests" element={<ProtectedRoute allowedRoles={['PROVIDER']}><ProviderRequests /></ProtectedRoute>} />
        <Route path="/provider/jobs" element={<ProtectedRoute allowedRoles={['PROVIDER']}><ProviderActiveJob /></ProtectedRoute>} />
        <Route path="/provider/bookings" element={<ProtectedRoute allowedRoles={['PROVIDER']}><ProviderBookings /></ProtectedRoute>} />
        <Route path="/provider/earnings" element={<ProtectedRoute allowedRoles={['PROVIDER']}><ProviderEarnings /></ProtectedRoute>} />
        <Route path="/provider/profile" element={<ProtectedRoute allowedRoles={['PROVIDER']}><ProviderProfile /></ProtectedRoute>} />
      </Route>

      <Route element={<AdminLayout />}>
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/providers" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminProviders /></ProtectedRoute>} />
        <Route path="/admin/services" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminServices /></ProtectedRoute>} />
        <Route path="/admin/bookings" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminBookings /></ProtectedRoute>} />
        <Route path="/admin/reviews" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminReviews /></ProtectedRoute>} />
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
