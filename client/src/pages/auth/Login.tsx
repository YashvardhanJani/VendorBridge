import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@vendorbridge.com', label: 'Admin (Anita Reddy)' },
  { role: 'Manager', email: 'manager@vendorbridge.com', label: 'Manager (Sanjay Kumar)' },
  { role: 'Officer', email: 'officer@vendorbridge.com', label: 'Officer (Rahul Sharma)' },
  { role: 'Vendor', email: 'vendor@vendorbridge.com', label: 'Vendor (Priya Patel)' },
];

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, error, loading, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!email || !password) {
      setValidationError('All fields are required.');
      return;
    }

    const success = await login({ email, password });
    if (success) {
      navigate('/dashboard');
    }
  };

  const handleSelectDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123'); // Default password from seed
    clearError();
    setValidationError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-surface-50 to-brand-100/30 p-4">
      {/* Background Decorative Blur Circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-200/40 rounded-full blur-3xl -z-10 animate-pulse duration-[6000ms]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-100/40 rounded-full blur-3xl -z-10 animate-pulse duration-[8000ms]" />

      <div className="w-full max-w-md">
        {/* Brand Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-600 rounded-2xl shadow-lg shadow-brand-500/20 text-white font-extrabold text-2xl mb-3 tracking-wider">
            VB
          </div>
          <h1 className="text-3xl font-extrabold text-surface-900 tracking-tight">
            Vendor<span className="text-brand-600">Bridge</span>
          </h1>
          <p className="text-sm text-surface-500 mt-2">
            Procurement & Quotation Lifecycle ERP
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8 border border-surface-200 shadow-xl rounded-2xl bg-white/95">
          <h2 className="text-xl font-semibold text-surface-900 mb-6">
            Sign in to your account
          </h2>

          {(error || validationError) && (
            <div className="mb-5 p-4 bg-danger-50 border border-danger-200 text-danger-700 text-sm rounded-xl flex items-start gap-2">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{validationError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="input-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) clearError();
                }}
              />
            </div>

            <div>
              <label className="input-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) clearError();
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Quick Demo Login Option */}
          <div className="mt-8 border-t border-surface-100 pt-6">
            <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">
              Quick access demo accounts
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => handleSelectDemo(account.email)}
                  className="px-3 py-2 bg-surface-50 hover:bg-brand-50 border border-surface-200 hover:border-brand-200 text-left rounded-xl transition-all duration-200"
                >
                  <div className="text-xs font-medium text-surface-800">{account.role}</div>
                  <div className="text-[10px] text-surface-400 truncate">{account.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-surface-500 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-brand-600 font-semibold hover:underline">
            Register a vendor profile
          </Link>
        </p>
      </div>
    </div>
  );
};
