import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, MapPin, Calendar, HeartHandshake, Gift, FileText, Info, Bot, Camera, Activity, Menu, X } from 'lucide-react';
import { clsx } from 'clsx';

export default function Layout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/need-food', label: 'Need Food Now', icon: MapPin },
    { path: '/pantries', label: 'Partner Agencies', icon: MapPin },
    { path: '/events', label: 'MetroMarket & Events', icon: Calendar },
    { path: '/assistant', label: 'AI Assistant', icon: Bot },
    { path: '/scanner', label: 'Scanner', icon: Camera },
    { path: '/volunteer', label: 'Volunteer', icon: HeartHandshake },
    { path: '/donate', label: 'Donate', icon: Gift },
    { path: '/snap', label: 'SNAP Help', icon: FileText },
    { path: '/resources', label: 'Nutrition & Resources', icon: Info },
    { path: '/dashboard', label: 'Command Center', icon: Activity },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 text-stone-900">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 text-stone-800 sticky top-0 z-30">
        <div className="flex justify-between items-center px-4 py-4 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 hover:bg-stone-100 rounded-xl transition-colors text-stone-600"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            {/* Desktop Sidebar Toggle */}
            <button 
              onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
              className="hidden md:block p-2 hover:bg-stone-100 rounded-xl transition-colors text-stone-600"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link to="/" className="text-xl font-bold tracking-tight text-emerald-700 flex items-center gap-2">
              <HeartHandshake className="w-6 h-6" />
              access-to-food
            </Link>
          </div>
          <div className="hidden sm:block text-xs font-bold tracking-wider uppercase text-stone-500 bg-stone-100 px-4 py-2 rounded-full">
            Part of the access-to series
          </div>
        </div>
      </header>
      
      {/* Mobile Hamburger Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          
          {/* Menu Panel */}
          <div className="relative flex flex-col w-4/5 max-w-sm bg-white h-full shadow-xl animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between p-4 border-b border-stone-100">
              <span className="font-bold text-lg text-stone-800">Menu</span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-stone-500 hover:bg-stone-100 rounded-full transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={clsx(
                      "flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-colors",
                      isActive ? "bg-emerald-50 text-emerald-700 font-bold" : "text-stone-600 hover:bg-stone-50 hover:text-emerald-700 font-medium"
                    )}
                  >
                    <Icon className={clsx("w-5 h-5", isActive ? "text-emerald-600" : "text-stone-400")} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
            
            <div className="p-4 border-t border-stone-100 bg-stone-50">
              <div className="text-xs font-medium text-stone-500 text-center space-y-1">
                <p className="font-bold text-stone-700">access-to-food</p>
                <p>Part of the access-to series</p>
                <p>Community Support Hub</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1">
        {/* Desktop Sidebar Navigation (hidden on mobile) */}
        <nav 
          className={clsx(
            "hidden md:block sticky top-[73px] h-[calc(100vh-73px)] bg-white border-r border-stone-200 overflow-y-auto transition-all duration-300 z-20",
            isDesktopSidebarOpen ? "w-64" : "w-20"
          )}
        >
          <div className="space-y-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={!isDesktopSidebarOpen ? item.label : undefined}
                  className={clsx(
                    "flex items-center space-x-3 py-3 rounded-xl transition-colors",
                    isDesktopSidebarOpen ? "px-4" : "justify-center px-0",
                    isActive ? "bg-emerald-50 text-emerald-700 font-medium" : "text-stone-600 hover:bg-stone-50 hover:text-emerald-700"
                  )}
                >
                  <Icon className={clsx("w-5 h-5 shrink-0", isActive ? "text-emerald-600" : "text-stone-400")} />
                  {isDesktopSidebarOpen && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        <main className="flex-1 w-full p-4 md:p-8 lg:p-10 pb-12 overflow-x-hidden">
          <div className="w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
