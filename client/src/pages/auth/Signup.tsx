import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { USER_ROLES } from '../../utils/constants';

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { signup, error, loading, clearError } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Officer' | 'Vendor' | 'Manager' | 'Admin'>('Vendor');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!name || !email || !password) {
      setValidationError('All fields are required.');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters.');
      return;
    }

    const success = await signup({ name, email, password, role });
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-surface-50 to-brand-100/30 p-4">
      {/* Background Decorative Blur Circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-200/40 rounded-full blur-3xl -z-10 animate-pulse duration-[6000ms]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-100/40 rounded-full blur-3xl -z-10 animate-pulse duration-[8000ms]" />

      <div className="w-full max-w-md">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-600 rounded-2xl shadow-lg shadow-brand-500/20 text-white font-extrabold text-2xl mb-3 tracking-wider">
            VB
          </div>
          <h1 className="text-3xl font-extrabold text-surface-900 tracking-tight">
            Vendor<span className="text-brand-600">Bridge</span>
          </h1>
          <p className="text-sm text-surface-500 mt-2">
            Create a new platform account
          </p>
        </div>

        {/* Signup Card */}
        <div className="glass-card p-8 border border-surface-200 shadow-xl rounded-2xl bg-white/95">
          <h2 className="text-xl font-semibold text-surface-900 mb-6">
            Register your profile
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
              <label className="input-label" htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                className="input-field"
                placeholder="John Doe"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) clearError();
                }}
              />
            </div>

            <div>
              <label className="input-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="input-field"
                placeholder="john@example.com"
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
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) clearError();
                }}
              />
            </div>

            <div>
              <label className="input-label" htmlFor="role">Platform Role</label>
              <select
                id="role"
                className="input-field"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
              >
                {USER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
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
                  <span>Registering...</span>
                </>
              ) : (
                <span>Register Account</span>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-surface-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 font-semibold hover:underline">
            Sign in instead
          </Link>
        </p>
      </div>
    </div>
  );
};
