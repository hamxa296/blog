import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import galleryBg from '../assets/homepc.webp';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, loginUser, signInWithGoogle, logoutUser } from '../services/firebase';
import { Button } from '../components/ui/button';

const STAFF_ROLES = new Set(['editor', 'moderator', 'admin']);

export const EditorLogin: React.FC = () => {
  const { user, profile, role, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  const admitIfStaff = useCallback(
    async (uid: string) => {
      await refreshProfile();
      const res = await getUserProfile(uid);
      const nextRole = res.success && res.profile?.role ? res.profile.role : null;
      const name = res.profile?.displayName || profile?.displayName || '';

      if (nextRole && STAFF_ROLES.has(nextRole)) {
        toast.success(`Welcome back, Editor ${name}`.trim());
        navigate('/editor', { replace: true });
        return;
      }

      setAccessDenied(true);
    },
    [navigate, profile?.displayName, refreshProfile],
  );

  useEffect(() => {
    if (authLoading || loading || googleLoading) return;
    if (user && role && STAFF_ROLES.has(role) && !accessDenied) {
      navigate('/editor', { replace: true });
    } else if (user && role && !STAFF_ROLES.has(role)) {
      setAccessDenied(true);
    }
  }, [user, role, authLoading, loading, googleLoading, accessDenied, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccessDenied(false);
    setLoading(true);
    try {
      const res = await loginUser(email, password);
      if (!res.success || !res.user) {
        toast.error(res.error || 'Login failed.');
        return;
      }
      await admitIfStaff(res.user.uid);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setAccessDenied(false);
    setGoogleLoading(true);
    try {
      const res = await signInWithGoogle();
      if (!res.success || !res.user) {
        toast.error(res.error || 'Google sign-in failed.');
        return;
      }
      await admitIfStaff(res.user.uid);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLeave = async () => {
    await logoutUser();
    navigate('/');
  };

  return (
    <main className="relative z-10 min-h-screen">
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${galleryBg})` }}
      />

      <div className="max-w-md mx-auto px-4 pt-16 sm:pt-24 pb-24">
        <div className="text-center mb-8 space-y-3">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.35em] text-muted-foreground font-medium">
            Staff Gateway
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            GIKI Chronicles Editorial Board
          </h1>
          <p className="text-sm text-muted-foreground font-light leading-relaxed">
            Sign in with an authorized editor, moderator, or admin account to open your review workspace.
          </p>
        </div>

        {accessDenied ? (
          <div className="rounded-2xl border border-red-500/30 bg-card/50 backdrop-blur-md p-6 space-y-4 text-center">
            <h2 className="text-lg font-semibold text-red-400">Access Restricted</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your account is registered as a Student Author. This portal is reserved for authorized
              Editorial Board members.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button type="button" variant="outline" onClick={handleLeave} className="rounded-full">
                Go to Student Portal / Home
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md p-6 space-y-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
          >
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-card/50 border border-border/50 rounded-full px-5 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50"
                placeholder="editor@giki.edu.pk"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-card/50 border border-border/50 rounded-full px-5 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50"
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" disabled={loading || googleLoading} className="w-full rounded-full">
              {loading ? 'Signing in…' : 'Enter Editorial Workspace'}
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/40" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                <span className="bg-card/80 px-3 text-muted-foreground">or</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={loading || googleLoading}
              onClick={handleGoogle}
              className="w-full rounded-full"
            >
              {googleLoading ? 'Connecting…' : 'Continue with Google'}
            </Button>

            <p className="text-center text-xs text-muted-foreground pt-2">
              Not on the board?{' '}
              <Link to="/" className="text-foreground underline underline-offset-2">
                Return home
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
};

export default EditorLogin;
