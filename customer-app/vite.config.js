import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/');
          if (!normalized.includes('node_modules/')) return;
          if (normalized.includes('/node_modules/firebase/') || normalized.includes('/node_modules/@firebase/')) {
            return 'firebase';
          }
          if (normalized.includes('/node_modules/leaflet/') || normalized.includes('/node_modules/react-leaflet/') || normalized.includes('/node_modules/@react-leaflet/')) {
            return 'maps';
          }
          if (normalized.includes('/node_modules/lucide-react/')) {
            return 'icons';
          }
          if (
            normalized.includes('/node_modules/react/') ||
            normalized.includes('/node_modules/react-dom/') ||
            normalized.includes('/node_modules/react-router/') ||
            normalized.includes('/node_modules/react-router-dom/') ||
            normalized.includes('/node_modules/@remix-run/') ||
            normalized.includes('/node_modules/scheduler/')
          ) {
            return 'react';
          }
        },
      },
    },
  },
});
