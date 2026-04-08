import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load pages for better initial load performance
const Home = lazy(() => import('./pages/Home'));
const Pantries = lazy(() => import('./pages/Pantries'));
const Events = lazy(() => import('./pages/Events'));
const Volunteer = lazy(() => import('./pages/Volunteer'));
const Donate = lazy(() => import('./pages/Donate'));
const NeedFood = lazy(() => import('./pages/NeedFood'));
const Snap = lazy(() => import('./pages/Snap'));
const Resources = lazy(() => import('./pages/Resources'));
const Assistant = lazy(() => import('./pages/Assistant'));
const Scanner = lazy(() => import('./pages/Scanner'));
const CommandCenter = lazy(() => import('./pages/CommandCenter'));
const Corporate = lazy(() => import('./pages/Corporate'));

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
  </div>
);

// 404 page
const NotFound = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
    <h1 className="text-6xl font-black text-stone-300 mb-4">404</h1>
    <h2 className="text-xl font-bold text-stone-800 mb-2">Page not found</h2>
    <p className="text-stone-500 mb-6">The page you're looking for doesn't exist or has been moved.</p>
    <a href="/" className="bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-800 transition-colors">
      Go Home
    </a>
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="need-food" element={<NeedFood />} />
              <Route path="pantries" element={<Pantries />} />
              <Route path="events" element={<Events />} />
              <Route path="volunteer" element={<Volunteer />} />
              <Route path="donate" element={<Donate />} />
              <Route path="snap" element={<Snap />} />
              <Route path="resources" element={<Resources />} />
              <Route path="assistant" element={<Assistant />} />
              <Route path="scanner" element={<Scanner />} />
              <Route path="corporate" element={<Corporate />} />
              <Route path="dashboard" element={<CommandCenter />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
