import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUpUser, signInWithGoogle } from '../services/firebase';
import AuthSection from '../components/auth/AuthSection';

export const Signup: React.FC = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (data: {
    email: string;
    password: string;
    confirmPassword?: string;
  }) => {
    setError('');

    if (data.password !== data.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await signUpUser(data.email, data.password);
      if (res.success) navigate('/');
      else setError(res.error || 'Signup failed.');
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
      if (res.success) navigate('/');
      else setError(res.error || 'Google sign-in failed.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthSection
      mode="signup"
      onSubmit={handleSubmit}
      onGoogle={handleGoogleSignIn}
      loading={loading}
      googleLoading={googleLoading}
      error={error}
    />
  );
};
