import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-surface-50 to-brand-100/30 p-6">
      {/* Decorative Circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-200/40 rounded-full blur-3xl -z-10 animate-pulse duration-[6000ms]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-100/40 rounded-full blur-3xl -z-10 animate-pulse duration-[8000ms]" />

      <div className="max-w-md w-full text-center">
        <div className="glass-card p-8 bg-white/95 border border-surface-200 shadow-2xl rounded-2xl">
          {/* Animated Help Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-50 text-brand-600 rounded-3xl mb-6 shadow-sm">
            <HelpCircle className="w-10 h-10 animate-bounce duration-1000" />
          </div>

          <h1 className="text-6xl font-black text-brand-600 tracking-tight mb-2">404</h1>
          <h2 className="text-2xl font-bold text-surface-900 mb-3">Page Not Found</h2>
          <p className="text-sm text-surface-500 mb-8 leading-relaxed">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2"
            >
              <span>Go to Dashboard</span>
            </button>
            <button
              onClick={() => navigate(-1)}
              className="w-full btn-secondary py-3 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default NotFound;
