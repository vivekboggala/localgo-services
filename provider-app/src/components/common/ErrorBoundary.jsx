import React from 'react';
import { ErrorPage } from '../../pages/ErrorPage';

const isChunkLoadError = (error) => {
  const msg = String(error?.message || error || '').toLowerCase();
  return (
    msg.includes('failed to fetch dynamically imported module') ||
    msg.includes('importing a module script failed') ||
    msg.includes('loading chunk') ||
    msg.includes('error loading dynamically imported module')
  );
};

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Uncaught provider portal error:', error, info);
    if (isChunkLoadError(error)) {
      const key = 'localgo_chunk_reload_at';
      const last = Number(sessionStorage.getItem(key) || 0);
      if (Date.now() - last > 15000) {
        sessionStorage.setItem(key, String(Date.now()));
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      const chunkErr = isChunkLoadError(this.state.error);
      return (
        <ErrorPage
          title={chunkErr ? 'App Updated — Please Reload' : 'Something hit a snag'}
          message={
            chunkErr
              ? 'A newer version of LocalGo Partner was just deployed. Tap Reload to load the latest version.'
              : this.state.error?.message || 'An unexpected issue occurred.'
          }
          onReset={() => {
            this.setState({ hasError: false, error: null });
            window.location.reload();
          }}
        />
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
