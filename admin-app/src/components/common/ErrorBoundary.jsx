import React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button, Logo } from '../ui';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unexpected console error occurred.' };
  }

  componentDidCatch(error, errorInfo) {
    console.error('LocalGo Admin ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-brand-white rounded-sheet border border-gray-200 shadow-sheet p-8 space-y-5">
            <div className="flex justify-center">
              <Logo size="md" subtitle="Admin Console" />
            </div>
            <div className="w-16 h-16 rounded-full bg-rose-50 text-status-danger flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" strokeWidth={2} />
            </div>
            <div className="space-y-1.5">
              <h1 className="font-display font-bold text-ds-24 text-brand-ink">Something went wrong</h1>
              <p className="text-ds-14 text-gray-600">{this.state.message}</p>
            </div>
            <Button
              variant="accent"
              fullWidth
              leftIcon={<RotateCw className="w-4 h-4" strokeWidth={2} />}
              onClick={() => window.location.reload()}
            >
              Reload Admin Console
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
