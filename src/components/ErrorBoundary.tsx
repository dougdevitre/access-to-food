import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

// Catches lazy-chunk load failures and render errors anywhere below it so the
// app shows a friendly, recoverable screen instead of a blank white page.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-8 text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-amber-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-stone-800">Something went wrong</h1>
            <p className="text-sm text-stone-500 font-medium">
              The page ran into an unexpected error. Reloading usually fixes it — your place in the app isn't lost.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 bg-emerald-700 text-white font-semibold px-6 py-3 rounded-2xl hover:bg-emerald-800 transition-colors shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Reload
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-stone-100 text-stone-700 font-semibold px-6 py-3 rounded-2xl hover:bg-stone-200 transition-colors"
            >
              Back to home
            </a>
          </div>
          <p className="text-xs text-stone-400 pt-2">
            If this keeps happening, call the United Way helpline at{' '}
            <a href="tel:211" className="font-semibold text-emerald-700 hover:underline">2-1-1</a>{' '}
            for immediate food assistance.
          </p>
        </div>
      </div>
    );
  }
}
