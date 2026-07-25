import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loginUser, signInWithGoogle } from '../services/firebase';
import AuthSection from '../components/auth/AuthSection';

export const Login: React.FC = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleRedirect = () => {
    const next = searchParams.get('next');
    const redirectTo = next ? decodeURIComponent(next) : '/';
    navigate(redirectTo);
  };

  const handleSubmit = async (data: {
    email: string;
    password: string;
  }) => {
    setError('');
    setLoading(true);

    try {
      const res = await loginUser(data.email, data.password);
      if (res.success) {
        handleRedirect();
      } else {
        setError(res.error || 'Login failed.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthSection
      mode="login"
      onSubmit={handleSubmit}
      onGoogle={handleGoogleSignIn}
      loading={loading}
      googleLoading={googleLoading}
      error={error}
    />
  );
};
