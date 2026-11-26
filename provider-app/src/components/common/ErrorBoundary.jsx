import React from 'react';
import { ErrorPage } from '../../pages/ErrorPage';

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
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorPage
          message={this.state.error?.message || 'An unexpected issue occurred.'}
          onReset={() => {
            this.setState({ hasError: false, error: null });
            window.location.href = '/dashboard';
          }}
        />
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
