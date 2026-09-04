import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { LSG_DEPARTMENTS } from '../../services/seedData.js';
import {
  Building2,
  Mail,
  Lock,
  User,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  AlertTriangle,
  Info,
} from 'lucide-react';

export default function AdminAuth() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState(LSG_DEPARTMENTS[0]);
  const [secretCode, setSecretCode] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { loginAdmin, signupAdmin, isFirebaseConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/admin';

  const formatFirebaseError = (err) => {
    const code = err?.code || '';
    if (code.includes('auth/invalid-credential') || code.includes('auth/wrong-password')) {
      return 'Invalid officer email or password. Please verify your credentials.';
    }
    if (code.includes('auth/user-not-found')) {
      return 'No official account found with this email. Please register your authority account.';
    }
    if (code.includes('auth/email-already-in-use')) {
      return 'This email address is already registered.';
    }
    if (code.includes('auth/weak-password')) {
      return 'Password should be at least 6 characters.';
    }
    return err.message || 'Authentication failed. Please verify your connection.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegistering) {
        if (!name.trim()) throw new Error('Please enter officer name.');
        await signupAdmin(email, password, name.trim(), department, secretCode);
      } else {
        await loginAdmin(email, password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(formatFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-950 text-slate-100">
      <div className="max-w-md w-full bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-teal-500/10 text-teal-400 rounded-2xl mb-3 border border-teal-500/20">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {isRegistering ? 'Register Authority Account' : 'Authority Portal Login'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Municipal Administration & Engineering Executive Console
          </p>
        </div>

        {!isFirebaseConfigured && (
          <div className="mb-6 p-4 bg-amber-950/60 border border-amber-800 rounded-2xl text-xs text-amber-300 flex items-start gap-3">
            <Info className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
            <div>
              <strong>Firebase Setup Needed:</strong> Paste your Firebase web credentials into{' '}
              <code className="font-mono bg-amber-900 px-1 py-0.5 rounded">.env</code> to activate live authentication.
            </div>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex rounded-xl bg-slate-800 p-1 mb-6 border border-slate-700">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(false);
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              !isRegistering ? 'bg-slate-900 text-teal-300 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Officer Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegistering(true);
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              isRegistering ? 'bg-slate-900 text-teal-300 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register Officer
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300 font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Official Name & Designation
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. K. S. Narayanan (Municipal Engineer)"
                    className="w-full text-sm pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Department / Domain
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full text-sm px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                >
                  {LSG_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept} className="bg-slate-900 text-white">
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Administrator Authorization Key
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={secretCode}
                    onChange={(e) => setSecretCode(e.target.value)}
                    placeholder="Default: ADMIN-KEY-2026"
                    className="w-full text-sm pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Prevents unauthorized citizen registrations into the authority tier.
                </span>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Official Email ID
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@civic.local"
                className="w-full text-sm pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-sm pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !isFirebaseConfigured}
            className="w-full py-3 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Authenticating...' : isRegistering ? 'Register Authority Account' : 'Sign In as Authority Officer'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Citizen looking to report an issue?{' '}
          <Link to="/citizen/login" className="font-bold text-teal-400 hover:underline">
            Citizen Portal Login
          </Link>
        </div>
      </div>
    </div>
  );
}
