import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center" role="alert">
          <div className="bg-rose-50 p-4 rounded-2xl mb-4">
            <AlertTriangle className="w-10 h-10 text-rose-600" />
          </div>
          <h2 className="text-xl font-bold text-stone-800 mb-2">Something went wrong</h2>
          <p className="text-stone-600 mb-6 max-w-md">
            An unexpected error occurred. Please try reloading the page.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="flex items-center gap-2 bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-800 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
