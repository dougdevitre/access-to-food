import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Reset scroll to the top on every route change. Without this, navigating from
// a long list (e.g. Pantries) to another page keeps the old scroll position.
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
