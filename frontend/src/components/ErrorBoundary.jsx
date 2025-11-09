import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // TODO: send to monitoring service in production
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="p-6">
          <h2 className="text-xl font-bold">Something went wrong.</h2>
          <p className="mt-2">An unexpected error occurred. You can try reloading the page.</p>
          <div className="mt-4">
            <button onClick={() => window.location.reload()} className="btn">
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
