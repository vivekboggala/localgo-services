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

      <Route path="*" element={
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">404</h1>
          <p className="text-slate-500 mb-4 text-xs">Page not found</p>
          <a href="/dashboard" className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg text-xs">Go to Admin Console</a>
        </div>
      } />
    </Routes>
  );
};
