import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactElement;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (!user) {
    // Redirect to login with previous path as a parameter
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <main className="container mx-auto px-6 py-20 text-center text-white min-h-[calc(100vh-88px)] flex flex-col justify-center items-center">
        <div className="max-w-md w-full bg-black/40 p-8 rounded-3xl border border-red-500/30 backdrop-blur-md shadow-lg shadow-red-950/20">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m0-6v2m0-5h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-3 text-red-400">Access Denied</h1>
          <p className="text-white/70 mb-6 text-sm">
            This section is restricted to administrators. If you believe this is an error, please contact support.
          </p>
          <a
            href="/"
            className="inline-block bg-[#1A3D63] border border-[#4A7FA7] hover:bg-[#4A7FA7] text-white px-6 py-2 rounded-full transition duration-300 font-semibold"
          >
            Go back Home
          </a>
        </div>
      </main>
    );
  }

  return children;
};
