import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProviderLayout } from '../layouts/ProviderLayout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { Skeleton, SkeletonCard } from '../components/ui';

const LoginPage = lazy(() => import('../pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('../pages/SignupPage').then((m) => ({ default: m.SignupPage })));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));
const ErrorPage = lazy(() => import('../pages/ErrorPage').then((m) => ({ default: m.ErrorPage })));

const ProviderDashboard = lazy(() => import('../pages/provider/ProviderDashboard').then((m) => ({ default: m.ProviderDashboard })));
const ProviderRequests = lazy(() => import('../pages/provider/ProviderRequests').then((m) => ({ default: m.ProviderRequests })));
const ProviderActiveJob = lazy(() => import('../pages/provider/ProviderActiveJob').then((m) => ({ default: m.ProviderActiveJob })));
const ProviderJobDetailPage = lazy(() => import('../pages/provider/ProviderJobDetailPage').then((m) => ({ default: m.ProviderJobDetailPage })));
const ProviderBookings = lazy(() => import('../pages/provider/ProviderBookings').then((m) => ({ default: m.ProviderBookings })));
const ProviderEarnings = lazy(() => import('../pages/provider/ProviderEarnings').then((m) => ({ default: m.ProviderEarnings })));
const ProviderProfile = lazy(() => import('../pages/provider/ProviderProfile').then((m) => ({ default: m.ProviderProfile })));

const VerifyEmailPage = lazy(() => import('../pages/auth/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const DesignPreviewPage = lazy(() => import('../pages/DesignPreviewPage').then((m) => ({ default: m.DesignPreviewPage })));

const RouteFallback = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
    <Skeleton className="h-9 w-56 rounded-lg" />
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
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route element={<ProviderLayout />}>
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['PROVIDER']}><ProviderDashboard /></ProtectedRoute>} />
          <Route path="/requests" element={<ProtectedRoute allowedRoles={['PROVIDER']}><ProviderRequests /></ProtectedRoute>} />
          <Route path="/jobs" element={<ProtectedRoute allowedRoles={['PROVIDER']}><ProviderActiveJob /></ProtectedRoute>} />
          <Route path="/jobs/:id" element={<ProtectedRoute allowedRoles={['PROVIDER']}><ProviderJobDetailPage /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute allowedRoles={['PROVIDER']}><ProviderBookings /></ProtectedRoute>} />
          <Route path="/earnings" element={<ProtectedRoute allowedRoles={['PROVIDER']}><ProviderEarnings /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute allowedRoles={['PROVIDER']}><ProviderProfile /></ProtectedRoute>} />
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
