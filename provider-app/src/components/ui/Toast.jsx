import React from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export const AppToaster = ({ position = 'top-center' }) => (
  <Toaster
    position={position}
    toastOptions={{
      duration: 3200,
      style: {
        background: '#0B0B0F',
        color: '#FFFFFF',
        borderRadius: '12px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: 600,
        border: '1px solid #17171C',
        boxShadow: '0 10px 30px rgba(11, 11, 15, 0.25)',
      },
      success: {
        iconTheme: { primary: '#12B76A', secondary: '#FFFFFF' },
      },
      error: {
        iconTheme: { primary: '#F04438', secondary: '#FFFFFF' },
      },
    }}
  />
);

export const showToast = {
  success: (msg) =>
    toast(msg, {
      icon: <CheckCircle2 className="w-5 h-5 text-status-success shrink-0" strokeWidth={2} />,
    }),
  error: (msg) =>
    toast(msg, {
      icon: <AlertCircle className="w-5 h-5 text-status-danger shrink-0" strokeWidth={2} />,
    }),
  warning: (msg) =>
    toast(msg, {
      icon: <AlertTriangle className="w-5 h-5 text-brand-yellow shrink-0" strokeWidth={2} />,
    }),
  info: (msg) =>
    toast(msg, {
      icon: <Info className="w-5 h-5 text-status-info shrink-0" strokeWidth={2} />,
    }),
};

export default AppToaster;
