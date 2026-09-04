import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';

// Citizen Pages
import CitizenAuth from './pages/citizen/CitizenAuth.jsx';
import SubmitComplaint from './pages/citizen/SubmitComplaint.jsx';
import MyComplaints from './pages/citizen/MyComplaints.jsx';
import ComplaintDetail from './pages/citizen/ComplaintDetail.jsx';

// Admin Pages
import AdminAuth from './pages/admin/AdminAuth.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminMapView from './pages/admin/AdminMapView.jsx';
import AdminAnalytics from './pages/admin/AdminAnalytics.jsx';

// Protected Route Wrapper for LSG Authority / Admin
function AdminRoute({ children }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}

// Protected Route Wrapper for Citizen
function CitizenRoute({ children }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/citizen/login" state={{ from: location }} replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
          <Navbar />

          <main className="flex-1">
            <Routes>
              {/* Default Redirect */}
              <Route path="/" element={<Navigate to="/citizen" replace />} />

              {/* Citizen Portal Routes */}
              <Route path="/citizen" element={<SubmitComplaint />} />
              <Route path="/citizen/login" element={<CitizenAuth />} />
              <Route
                path="/citizen/my-complaints"
                element={
                  <CitizenRoute>
                    <MyComplaints />
                  </CitizenRoute>
                }
              />
              <Route path="/citizen/complaint/:id" element={<ComplaintDetail />} />

              {/* Government Authority Portal Routes */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route path="/admin/login" element={<AdminAuth />} />
              <Route
                path="/admin/map"
                element={
                  <AdminRoute>
                    <AdminMapView />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <AdminRoute>
                    <AdminAnalytics />
                  </AdminRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/citizen" replace />} />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-slate-200/90 py-6 text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div>
                <span className="font-bold text-slate-800">JanMithra</span> — Local Self-Government Department (LSGD), Government of Kerala
              </div>
              <div className="text-slate-400 text-[11px]">
                Citizen Grievance Redressal & Intelligent Civic Routing Portal
              </div>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
