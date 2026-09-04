import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  ShieldAlert,
  PlusCircle,
  ListOrdered,
  LayoutDashboard,
  MapPin,
  BarChart3,
  LogOut,
  User,
  ArrowRightLeft,
  ShieldCheck,
} from 'lucide-react';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isAdminPortal = location.pathname.startsWith('/admin');

  const handlePortalSwitch = () => {
    if (isAdminPortal) {
      navigate('/citizen');
    } else {
      navigate('/admin');
    }
  };

  const navItemClass = (path) => {
    const active = location.pathname === path;
    if (isAdminPortal) {
      return `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
        active
          ? 'bg-slate-800 text-teal-400 shadow-sm'
          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
      }`;
    }
    return `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
      active
        ? 'bg-teal-50 text-teal-700 shadow-sm border border-teal-100'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-colors border-b ${
        isAdminPortal
          ? 'bg-slate-950 text-slate-100 border-slate-800'
          : 'bg-white/95 backdrop-blur-md text-slate-900 border-slate-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Portal Branding */}
          <div className="flex items-center gap-3">
            <Link to={isAdminPortal ? '/admin' : '/citizen'} className="flex items-center gap-2.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl shadow-md ${
                  isAdminPortal
                    ? 'bg-gradient-to-br from-teal-400 to-emerald-600 text-slate-950'
                    : 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white'
                }`}
              >
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg tracking-tight">JanMithra</span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      isAdminPortal
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                        : 'bg-teal-50 text-teal-700 border border-teal-200'
                    }`}
                  >
                    {isAdminPortal ? 'Authority Portal' : 'Citizen Portal'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-none">
                  Kerala Local Self-Government Department
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {!isAdminPortal ? (
              <>
                <Link to="/citizen" className={navItemClass('/citizen')}>
                  <PlusCircle className="w-4 h-4" />
                  Report Issue
                </Link>
                <Link to="/citizen/my-complaints" className={navItemClass('/citizen/my-complaints')}>
                  <ListOrdered className="w-4 h-4" />
                  My Complaints
                </Link>
              </>
            ) : (
              <>
                <Link to="/admin" className={navItemClass('/admin')}>
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link to="/admin/map" className={navItemClass('/admin/map')}>
                  <MapPin className="w-4 h-4" />
                  GIS Map
                </Link>
                <Link to="/admin/analytics" className={navItemClass('/admin/analytics')}>
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </Link>
              </>
            )}
          </nav>

          {/* Right Action Tools: Portal Switcher + Profile */}
          <div className="flex items-center gap-2.5">
            {/* Quick Portal Switcher Button */}
            <button
              onClick={handlePortalSwitch}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all shadow-sm ${
                isAdminPortal
                  ? 'bg-slate-900 hover:bg-slate-800 text-teal-300 border-teal-500/40'
                  : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-800'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isAdminPortal ? 'Citizen View' : 'Authority View'}
              </span>
            </button>

            {/* User Session Info / Logout */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-300 dark:border-slate-800">
                <div className="hidden lg:block text-right">
                  <div className="text-xs font-semibold leading-tight flex items-center justify-end gap-1">
                    {currentUser.role === 'admin' ? (
                      <ShieldCheck className="w-3 h-3 text-teal-500" />
                    ) : (
                      <User className="w-3 h-3 text-slate-400" />
                    )}
                    <span>{currentUser.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                    {currentUser.role}
                  </span>
                </div>

                <button
                  onClick={logout}
                  title="Sign Out"
                  className={`p-2 rounded-lg transition-colors ${
                    isAdminPortal
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                      : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to={isAdminPortal ? '/admin/login' : '/citizen/login'}
                className="text-xs font-bold px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div
        className={`md:hidden px-4 py-2 border-t flex items-center justify-around text-xs ${
          isAdminPortal ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}
      >
        {!isAdminPortal ? (
          <>
            <Link to="/citizen" className={navItemClass('/citizen')}>
              <PlusCircle className="w-3.5 h-3.5" />
              Report Issue
            </Link>
            <Link to="/citizen/my-complaints" className={navItemClass('/citizen/my-complaints')}>
              <ListOrdered className="w-3.5 h-3.5" />
              My Complaints
            </Link>
          </>
        ) : (
          <>
            <Link to="/admin" className={navItemClass('/admin')}>
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </Link>
            <Link to="/admin/map" className={navItemClass('/admin/map')}>
              <MapPin className="w-3.5 h-3.5" />
              Map
            </Link>
            <Link to="/admin/analytics" className={navItemClass('/admin/analytics')}>
              <BarChart3 className="w-3.5 h-3.5" />
              Analytics
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
