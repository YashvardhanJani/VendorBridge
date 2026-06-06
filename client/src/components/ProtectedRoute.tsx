import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { UserRole } from '../utils/constants';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const location = useLocation();
  const { isAuthenticated, user, loading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-50">
        <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4" />
        <p className="text-sm text-surface-500 font-medium animate-pulse">
          Securing session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login but save the current location they tried to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Role not authorized - show access denied
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 p-6">
        <div className="max-w-md w-full text-center glass-card p-8 bg-white shadow-xl">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-danger-50 text-danger-600 rounded-2xl mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0-6v2m0-8h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-surface-900 mb-2">Access Denied</h1>
          <p className="text-sm text-surface-500 mb-6">
            Your role ({user.role}) does not have permission to access this page. Please contact your administrator.
          </p>
          <Navigate to="/dashboard" replace />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
