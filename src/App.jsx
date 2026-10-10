import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import AppShell from './components/AppShell.jsx';
import { Spinner } from './components/ui.jsx';

// Citizen Pages
import CitizenAuth from './pages/citizen/CitizenAuth.jsx';
import PublicOverview from './pages/citizen/PublicOverview.jsx';
import SubmitComplaint from './pages/citizen/SubmitComplaint.jsx';
import MyComplaints from './pages/citizen/MyComplaints.jsx';
import ComplaintDetail from './pages/citizen/ComplaintDetail.jsx';

// Admin Pages
import AdminAuth from './pages/admin/AdminAuth.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminMapView from './pages/admin/AdminMapView.jsx';
import AdminAnalytics from './pages/admin/AdminAnalytics.jsx';

function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Spinner label="Loading…" />
    </div>
  );
}

// Protected wrapper for LSG Authority / Admin
function AdminRoute({ children }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;
  if (!currentUser || currentUser.role !== 'admin') {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  return children;
}

// Protected wrapper for signed-in citizens
function CitizenRoute({ children }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;
  if (!currentUser) {
    return <Navigate to="/citizen/login" state={{ from: location }} replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/citizen/overview" replace />} />

          {/* Auth screens (full-page, no sidebar) */}
          <Route path="/citizen/login" element={<CitizenAuth />} />
          <Route path="/admin/login" element={<AdminAuth />} />

          {/* Citizen portal */}
          <Route element={<AppShell portal="citizen" />}>
            <Route path="/citizen/overview" element={<PublicOverview />} />
            <Route path="/citizen" element={<SubmitComplaint />} />
            <Route
              path="/citizen/my-complaints"
              element={
                <CitizenRoute>
                  <MyComplaints />
                </CitizenRoute>
              }
            />
            <Route
              path="/citizen/complaint/:id"
              element={
                <CitizenRoute>
                  <ComplaintDetail />
                </CitizenRoute>
              }
            />
          </Route>

          {/* Authority portal */}
          <Route
            element={
              <AdminRoute>
                <AppShell portal="admin" />
              </AdminRoute>
            }
          >
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/map" element={<AdminMapView />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
          </Route>

          <Route path="*" element={<Navigate to="/citizen/overview" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
