import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { AppRoutes } from './routes/AppRoutes';
import { AppToaster } from './components/ui';
import ServerWakeBanner from './components/common/ServerWakeBanner';
import ErrorBoundary from './components/common/ErrorBoundary';

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <LocationProvider>
            <AppToaster position="top-center" />
            <ServerWakeBanner />
            <AppRoutes />
          </LocationProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
