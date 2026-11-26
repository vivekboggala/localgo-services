import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppRoutes } from './routes/AppRoutes';
import { Toaster } from 'react-hot-toast';
import ServerWakeBanner from './components/common/ServerWakeBanner';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3000, style: { fontSize: '13px', borderRadius: '8px', background: '#0f172a', color: '#fff' } }} />
        <ServerWakeBanner />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
