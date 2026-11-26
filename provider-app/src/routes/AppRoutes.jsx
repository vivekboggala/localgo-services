import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProviderLayout } from '../layouts/ProviderLayout';

import { LoginPage } from '../pages/LoginPage';
import { SignupPage } from '../pages/SignupPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ErrorPage } from '../pages/ErrorPage';

import { ProviderDashboard } from '../pages/provider/ProviderDashboard';
import { ProviderRequests } from '../pages/provider/ProviderRequests';
import { ProviderActiveJob } from '../pages/provider/ProviderActiveJob';
import { ProviderJobDetailPage } from '../pages/provider/ProviderJobDetailPage';
import { ProviderBookings } from '../pages/provider/ProviderBookings';
import { ProviderEarnings } from '../pages/provider/ProviderEarnings';
import { ProviderProfile } from '../pages/provider/ProviderProfile';

import { ProtectedRoute } from '../components/common/ProtectedRoute';
import VerifyEmailPage from '../pages/auth/VerifyEmailPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import { DesignPreviewPage } from '../pages/DesignPreviewPage';

export const AppRoutes = () => {
  return (
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
  );
};
