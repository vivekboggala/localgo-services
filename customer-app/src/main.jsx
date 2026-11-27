import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  const key = 'localgo_chunk_reload_at';
  const last = Number(sessionStorage.getItem(key) || 0);
  if (Date.now() - last > 15000) {
    sessionStorage.setItem(key, String(Date.now()));
    window.location.reload();
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
