import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { Skeleton, SkeletonCard } from '../components/ui';

const LoginPage = lazy(() => import('../pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AdminProviders = lazy(() => import('../pages/admin/AdminProviders').then((m) => ({ default: m.AdminProviders })));
const AdminUsers = lazy(() => import('../pages/admin/AdminUsers').then((m) => ({ default: m.AdminUsers })));
const AdminBookings = lazy(() => import('../pages/admin/AdminBookings').then((m) => ({ default: m.AdminBookings })));
const AdminReviews = lazy(() => import('../pages/admin/AdminReviews').then((m) => ({ default: m.AdminReviews })));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const DesignPreviewPage = lazy(() => import('../pages/DesignPreviewPage').then((m) => ({ default: m.DesignPreviewPage })));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));
const ForbiddenPage = lazy(() => import('../pages/ForbiddenPage').then((m) => ({ default: m.ForbiddenPage })));
const ErrorPage = lazy(() => import('../pages/ErrorPage').then((m) => ({ default: m.ErrorPage })));

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

        <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/providers" element={<AdminProviders />} />
          <Route path="/users" element={<AdminUsers />} />
          <Route path="/bookings" element={<AdminBookings />} />
          <Route path="/reviews" element={<AdminReviews />} />
          <Route path="/admin/dashboard" element={<Navigate to="/dashboard" replace />} />
          <Route path="/admin/providers" element={<Navigate to="/providers" replace />} />
        </Route>

        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/design-preview" element={<DesignPreviewPage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route path="/error" element={<ErrorPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};
