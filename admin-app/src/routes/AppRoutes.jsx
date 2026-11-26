import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import { LoginPage } from '../pages/LoginPage';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AdminProviders } from '../pages/admin/AdminProviders';
import { AdminUsers } from '../pages/admin/AdminUsers';
import { AdminBookings } from '../pages/admin/AdminBookings';
import { AdminReviews } from '../pages/admin/AdminReviews';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import { DesignPreviewPage } from '../pages/DesignPreviewPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ForbiddenPage } from '../pages/ForbiddenPage';
import { ErrorPage } from '../pages/ErrorPage';
import { ProtectedRoute } from '../components/common/ProtectedRoute';

export const AppRoutes = () => {
  return (
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
  );
};
