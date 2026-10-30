import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  PlusCircle,
  ListChecks,
  LayoutDashboard,
  MapPin,
  BarChart3,
  LogOut,
  LogIn,
  Menu,
  X,
  Landmark,
  ArrowRightLeft,
} from 'lucide-react';

const NAV = {
  citizen: [
    { to: '/citizen/overview', label: 'Overview', short: 'Overview', icon: LayoutDashboard },
    { to: '/citizen', label: 'Report Issue', short: 'Report', icon: PlusCircle, end: true },
    { to: '/citizen/my-complaints', label: 'My Complaints', short: 'Complaints', icon: ListChecks },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', short: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/map', label: 'Map View', short: 'Map', icon: MapPin },
    { to: '/admin/analytics', label: 'Analytics', short: 'Analytics', icon: BarChart3 },
  ],
};

function Brand({ portal }) {
  return (
    <Link to={portal === 'admin' ? '/admin' : '/citizen/overview'} className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-brand-200">
        <Landmark className="w-5 h-5" />
      </div>
      <div className="leading-tight">
        <div className="text-base font-extrabold text-white tracking-tight">JanMithra</div>
        <div className="text-[10px] font-medium text-white/60">
          {portal === 'admin' ? 'Authority Console' : 'Kerala Civic Issue Platform'}
        </div>
      </div>
    </Link>
  );
}

function SidebarContent({ portal, onNavigate }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const items = NAV[portal];

  const handleLogout = async () => {
    await logout();
    onNavigate?.();
    navigate(portal === 'admin' ? '/admin/login' : '/citizen/login');
  };

  const initial = (currentUser?.name || currentUser?.email || '?').trim().charAt(0).toUpperCase();

  return (
    <div className="h-full flex flex-col">
      <div className="px-5 pt-6 pb-5">
        <Brand portal={portal} />
      </div>

      <nav className="px-3 flex-1 space-y-1" aria-label="Primary">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-white text-brand-900 shadow-sm'
                  : 'text-white/75 hover:text-white hover:bg-white/10'
              }`
            }
          >
            <Icon className="w-[18px] h-[18px]" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 space-y-2">
        <Link
          to={portal === 'admin' ? '/citizen' : '/admin'}
          onClick={onNavigate}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <ArrowRightLeft className="w-4 h-4" />
          {portal === 'admin' ? 'Citizen portal (signs out)' : 'Authority portal'}
        </Link>

        <div className="rounded-2xl bg-black/20 p-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-400 text-brand-950 font-extrabold text-sm flex items-center justify-center flex-shrink-0">
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-white truncate">{currentUser.name}</div>
                <div className="text-[11px] text-white/55 truncate">
                  {currentUser.role === 'admin' ? currentUser.department || 'Authority' : 'Citizen'}
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Sign out"
                aria-label="Sign out"
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to={portal === 'admin' ? '/admin/login' : '/citizen/login'}
              onClick={onNavigate}
              className="flex items-center justify-center gap-2 py-2 rounded-xl bg-white text-brand-900 text-sm font-bold hover:bg-brand-50 transition-colors"
            >
              <LogIn className="w-4 h-4" /> Sign in
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AppShell({ portal = 'citizen' }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const items = NAV[portal];
  const sidebarBg = portal === 'admin' ? 'bg-slate-900' : 'bg-brand-900';

  // Close drawer on navigation and lock body scroll while open
  useEffect(() => setDrawerOpen(false), [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Desktop sidebar */}
      <aside className={`hidden lg:block fixed inset-y-0 left-0 w-64 ${sidebarBg}`}>
        <SidebarContent portal={portal} />
      </aside>

      {/* Mobile top app bar */}
      <header
        className={`lg:hidden sticky top-0 z-30 ${sidebarBg} text-white flex items-center justify-between px-4 h-14`}
      >
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          className="p-2 -ml-2 rounded-lg hover:bg-white/10 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-base font-extrabold tracking-tight">JanMithra</span>
        <span className="w-9" aria-hidden="true" />
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-950/60 anim-fade" onClick={() => setDrawerOpen(false)} />
          <aside className={`absolute inset-y-0 left-0 w-72 max-w-[85%] ${sidebarBg} anim-drawer-left`}>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              className="absolute top-4 right-3 p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent portal={portal} onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      {/* Content */}
      <main className="lg:pl-64 pb-24 lg:pb-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Quick navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 grid"
        style={{
          gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {items.map(({ to, short, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2.5 text-[11px] font-bold transition-colors ${
                isActive ? 'text-brand-700' : 'text-slate-400'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {short}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
