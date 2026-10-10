import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import AuthLayout from '../../components/AuthLayout.jsx';
import { Alert } from '../../components/ui.jsx';
import { Mail, Lock, User, Phone, ArrowRight, Loader2 } from 'lucide-react';

const formatFirebaseError = (err) => {
  const code = err?.code || '';
  if (code.includes('auth/invalid-credential') || code.includes('auth/wrong-password')) {
    return 'Invalid email or password. Please check and try again.';
  }
  if (code.includes('auth/user-not-found')) return 'No account found with this email. Please register first.';
  if (code.includes('auth/email-already-in-use')) return 'This email is already registered. Please sign in instead.';
  if (code.includes('auth/weak-password')) return 'Password should be at least 6 characters long.';
  if (code.includes('auth/invalid-email')) return 'Please provide a valid email address.';
  if (code.includes('auth/popup-closed-by-user')) return 'Google sign-in was cancelled before completion.';
  if (code.includes('auth/too-many-requests')) return 'Too many attempts. Please wait a moment and try again.';
  if (code.includes('auth/network-request-failed')) return 'Network error. Please check your connection.';
  return err.message || 'Authentication failed. Please try again.';
};

function Field({ label, icon: Icon, ...props }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <Icon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input {...props} className="input pl-10" />
      </div>
    </div>
  );
}

export default function CitizenAuth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { loginCitizen, signupCitizen, loginWithGoogle, isFirebaseConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/citizen/overview';

  const run = async (fn) => {
    setError(null);
    setLoading(true);
    try {
      await fn();
      navigate(from, { replace: true });
    } catch (err) {
      setError(formatFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    run(async () => {
      if (isSignUp) {
        if (!name.trim()) throw new Error('Please enter your full name.');
        await signupCitizen(email, password, name.trim(), phone.trim());
      } else {
        await loginCitizen(email, password);
      }
    });
  };

  const switchMode = (signUp) => {
    setIsSignUp(signUp);
    setError(null);
  };

  return (
    <AuthLayout
      variant="citizen"
      title={isSignUp ? 'Create your account' : 'Welcome back'}
      subtitle={
        isSignUp
          ? 'Register to report issues and follow them until they are resolved.'
          : 'Sign in to report issues and track their progress.'
      }
      footer={
        <>
          Municipal authority official?{' '}
          <Link to="/admin/login" className="font-bold text-slate-700 hover:underline">
            Authority login
          </Link>
        </>
      }
    >
      {!isFirebaseConfigured && (
        <Alert tone="warning" className="mb-5">
          <strong>Firebase setup needed.</strong> Add your Firebase keys to <code className="font-mono">.env</code> to
          enable sign-in (see SETUP_GUIDE.md).
        </Alert>
      )}
      {error && <Alert tone="error" className="mb-5">{error}</Alert>}

      <button
        type="button"
        onClick={() => run(() => loginWithGoogle())}
        disabled={loading || !isFirebaseConfigured}
        className="btn-secondary w-full"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3 my-5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        <span className="flex-1 h-px bg-slate-200" />
        or use email
        <span className="flex-1 h-px bg-slate-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <>
            <Field label="Full name" icon={User} type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Anand Kumar" autoComplete="name" />
            <Field label="Mobile number (optional)" icon={Phone} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98470 12345" autoComplete="tel" />
          </>
        )}
        <Field label="Email address" icon={Mail} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
        <Field label="Password" icon={Lock} type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" autoComplete={isSignUp ? 'new-password' : 'current-password'} />

        <button type="submit" disabled={loading || !isFirebaseConfigured} className="btn-primary w-full py-3">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {loading ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        {isSignUp ? 'Already registered?' : 'New here?'}{' '}
        <button type="button" onClick={() => switchMode(!isSignUp)} className="font-bold text-brand-700 hover:underline cursor-pointer">
          {isSignUp ? 'Sign in' : 'Create an account'}
        </button>
      </p>
    </AuthLayout>
  );
}
