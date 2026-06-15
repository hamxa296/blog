import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUpUser, signInWithGoogle } from '../services/firebase';

export const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const navigate = useNavigate();

  const handleRedirect = () => {
    navigate('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await signUpUser(email, password);
      if (res.success) {
        handleRedirect();
      } else {
        setError(res.error || 'Signup failed.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const res = await signInWithGoogle();
      if (res.success) {
        handleRedirect();
      } else {
        setError(res.error || 'Google sign-in failed.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-88px)] flex items-center justify-center px-6 py-12 text-white">
      <div 
        className="w-full max-w-md rounded-3xl p-8 border border-[#B3CFE5]/50 shadow-2xl backdrop-blur-md relative"
        style={{
          background: 'linear-gradient(135deg, rgba(26, 61, 99, 0.95) 0%, rgba(74, 127, 167, 0.9) 100%)',
        }}
      >
        {/* Visual Texture overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-3xl"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 2px)',
            mixBlendMode: 'overlay',
          }}
        />

        {/* Logo and title */}
        <div className="text-center mb-6 relative z-10">
          <Link to="/" className="inline-flex flex-col items-center">
            <img src="/logo.png" alt="GIKI Chronicles Logo" className="h-16 w-auto mb-2" />
            <span className="text-xl font-bold tracking-wider font-serif text-[#F6FAFD]">GIKI Chronicles</span>
          </Link>
        </div>

        <h2 className="text-2xl font-bold text-center mb-1 text-[#F6FAFD]">Create an Account</h2>
        <p className="text-center text-[#B3CFE5]/80 mb-6 text-sm">Join the community!</p>

        {/* Google Sign-in */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center bg-white hover:bg-gray-50 text-gray-700 font-bold py-3 px-4 rounded-full transition duration-300 disabled:opacity-60 mb-4 cursor-pointer"
        >
          {googleLoading ? (
            <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin mr-3"></div>
          ) : (
            <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.021,35.596,44,30.038,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
            </svg>
          )}
          Sign up with Google
        </button>

        <div className="flex items-center my-4 relative z-10">
          <hr className="flex-grow border-t border-white/20" />
          <span className="px-3 text-[#B3CFE5]/60 text-xs font-semibold">OR</span>
          <hr className="flex-grow border-t border-white/20" />
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label htmlFor="email" className="block text-xs font-bold text-[#B3CFE5] uppercase tracking-wider mb-2">Email Address</label>
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@giki.edu.pk"
              className="w-full bg-white/10 border border-[#B3CFE5]/30 rounded-xl p-3 text-white placeholder-white/40 focus:outline-none focus:border-white focus:ring-3 focus:ring-white/10 transition-all"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-bold text-[#B3CFE5] uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              id="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full bg-white/10 border border-[#B3CFE5]/30 rounded-xl p-3 text-white placeholder-white/40 focus:outline-none focus:border-white focus:ring-3 focus:ring-white/10 transition-all"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-bold text-[#B3CFE5] uppercase tracking-wider mb-2">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/10 border border-[#B3CFE5]/30 rounded-xl p-3 text-white placeholder-white/40 focus:outline-none focus:border-white focus:ring-3 focus:ring-white/10 transition-all"
            />
          </div>

          {error && (
            <div className="text-red-300 bg-red-950/20 border border-red-500/20 text-center py-2 px-3 rounded-lg text-sm transition-all duration-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full font-bold py-3 px-4 rounded-full bg-[#4A7FA7] hover:bg-[#1A3D63] border border-[#B3CFE5]/40 text-white shadow-lg cursor-pointer transition-all duration-300 disabled:opacity-60"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-[#B3CFE5]/80 relative z-10">
          Already have an account?{' '}
          <Link to="/login" className="text-white hover:underline font-semibold">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
};
