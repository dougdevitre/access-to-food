import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
          <div className="bg-rose-50 p-4 rounded-full mb-6">
            <AlertTriangle className="w-10 h-10 text-rose-600" />
          </div>
          <h2 className="text-2xl font-bold text-stone-800 mb-2">Something went wrong</h2>
          <p className="text-stone-600 mb-6 max-w-md">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="flex items-center gap-2 bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
