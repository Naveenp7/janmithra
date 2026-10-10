import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import AuthLayout from '../../components/AuthLayout.jsx';
import { Alert } from '../../components/ui.jsx';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

const formatFirebaseError = (err) => {
  const code = err?.code || '';
  if (code.includes('auth/invalid-credential') || code.includes('auth/wrong-password') || code.includes('auth/user-not-found')) {
    return 'Invalid officer email or password. Please verify your credentials.';
  }
  if (code.includes('auth/too-many-requests')) return 'Too many attempts. Please wait a moment and try again.';
  if (code.includes('auth/network-request-failed')) return 'Network error. Please check your connection.';
  return err.message || 'Authentication failed. Please try again.';
};

export default function AdminAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { loginAdmin, isFirebaseConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/admin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginAdmin(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(formatFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      variant="admin"
      title="Authority sign in"
      subtitle="For municipal officials. Accounts are issued by your administrator."
      footer={
        <>
          Citizen looking to report an issue?{' '}
          <Link to="/citizen/login" className="font-bold text-slate-700 hover:underline">
            Citizen login
          </Link>
        </>
      }
    >
      {!isFirebaseConfigured && (
        <Alert tone="warning" className="mb-5">
          <strong>Firebase setup needed.</strong> Add your Firebase keys to <code className="font-mono">.env</code> to
          enable sign-in.
        </Alert>
      )}
      {error && <Alert tone="error" className="mb-5">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Official email</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="officer@civic.local" autoComplete="email" className="input pl-10" />
          </div>
        </div>
        <div>
          <label className="label">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" className="input pl-10" />
          </div>
        </div>

        <button type="submit" disabled={loading || !isFirebaseConfigured} className="btn-dark w-full py-3">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Verifying…' : 'Sign in'}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>
    </AuthLayout>
  );
}
