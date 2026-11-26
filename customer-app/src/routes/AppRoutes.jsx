import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { CustomerLayout } from '../layouts/CustomerLayout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { Skeleton, SkeletonCard } from '../components/ui';
import { ErrorPage } from '../pages/ErrorPage';

const LandingPage = lazy(() => import('../pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('../pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('../pages/SignupPage').then((m) => ({ default: m.SignupPage })));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

const ServiceListPage = lazy(() => import('../pages/customer/ServiceListPage').then((m) => ({ default: m.ServiceListPage })));
const CustomerDashboard = lazy(() => import('../pages/customer/CustomerDashboard').then((m) => ({ default: m.CustomerDashboard })));
const NearbyProvidersPage = lazy(() => import('../pages/customer/NearbyProvidersPage').then((m) => ({ default: m.NearbyProvidersPage })));
const MapPage = lazy(() => import('../pages/customer/MapPage').then((m) => ({ default: m.MapPage })));
const ProviderDetailPage = lazy(() => import('../pages/customer/ProviderDetailPage').then((m) => ({ default: m.ProviderDetailPage })));
const BookingFlow = lazy(() => import('../pages/customer/BookingFlow').then((m) => ({ default: m.BookingFlow })));
const MyBookingsPage = lazy(() => import('../pages/customer/MyBookingsPage').then((m) => ({ default: m.MyBookingsPage })));
const BookingDetailPage = lazy(() => import('../pages/customer/BookingDetailPage').then((m) => ({ default: m.BookingDetailPage })));
const NotificationsPage = lazy(() => import('../pages/customer/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const FavoritesPage = lazy(() => import('../pages/customer/FavoritesPage').then((m) => ({ default: m.FavoritesPage })));
const ProfilePage = lazy(() => import('../pages/customer/ProfilePage'));
const VerifyEmailPage = lazy(() => import('../pages/auth/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const DesignPreviewPage = lazy(() => import('../pages/DesignPreviewPage').then((m) => ({ default: m.DesignPreviewPage })));

const RouteFallback = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
    <Skeleton className="h-9 w-64 rounded-lg" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  </div>
);

export const AppRoutes = () => {
  return (
    <Suspense fallback={<RouteFallback />}>
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
    </Suspense>
  );
};
