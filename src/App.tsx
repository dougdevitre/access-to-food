import { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

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
const Login = lazy(() => import('./pages/Login'));

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
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
              <Route path="login" element={<Login />} />
              <Route path="scanner" element={
                <ProtectedRoute requiredRoles={['pantry_staff', 'admin']}>
                  <Scanner />
                </ProtectedRoute>
              } />
              <Route path="dashboard" element={
                <ProtectedRoute requiredRoles={['pantry_staff', 'admin']}>
                  <CommandCenter />
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
        </Suspense>
      </HashRouter>
    </AuthProvider>
  );
}
