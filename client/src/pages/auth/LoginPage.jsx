import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '@/config/firebase';
import { authService } from '@/services/authService';
import { AuthCard } from '@/components/auth/AuthCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { GoogleButton } from '@/components/ui/GoogleButton';
import { Divider } from '@/components/ui/Divider';
import { TextField } from '@/components/ui/TextField';
import { routePaths } from '@/routes/routePaths';

export function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);

      // AuthListener will pick up the session automatically.
      navigate(routePaths.home, { replace: true });
    } catch (err) {
      const messages = {
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/too-many-requests':
          'Too many failed attempts. Please try again later.',
      };
      setError(messages[err.code] || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const { user } = await signInWithPopup(auth, googleProvider);

      // If this is the user's first time, create a Firestore profile.
      // The register endpoint is idempotent so this is safe for returning users too.
      await authService.register({
        name: user.displayName || user.email.split('@')[0],
      });

      navigate(routePaths.home, { replace: true });
    } catch (err) {
      // User closed the popup — not an error worth showing
      if (err.code === 'auth/popup-closed-by-user') return;

      // Backend rejected: email already registered with a different method
      if (err.status === 409) {
        await signOut(auth);
        setError(err.message);
        return;
      }

      const messages = {
        'auth/account-exists-with-different-credential':
          'An account already exists with the same email. Try signing in with email/password.',
        'auth/cancelled-popup-request': '',
      };
      const msg = messages[err.code];
      if (msg !== '') setError(msg || err.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const isDisabled = loading || googleLoading;

  return (
    <AuthCard
      eyebrow="Welcome back"
      title="Sign in to QuickChat"
      description="Use your email and password to continue to your conversations."
      footer={
        <p className="text-sm text-slate-500">
          New here?{' '}
          <Link
            to={routePaths.signup}
            className="font-semibold text-sky-500 transition hover:text-sky-600"
          >
            Create an account
          </Link>
        </p>
      }
    >
      {/* ── Shared error display ── */}
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      {/* ── Google sign-in ── */}
      <GoogleButton onClick={handleGoogleSignIn} disabled={isDisabled}>
        {googleLoading ? 'Signing in…' : 'Continue with Google'}
      </GoogleButton>

      <Divider />

      {/* ── Email / password form ── */}
      <form className="space-y-5" onSubmit={handleSubmit}>

        <TextField
          label="Email"
          type="email"
          name="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          label="Password"
          type="password"
          name="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            className="font-semibold text-sky-500 transition hover:text-sky-600"
          >
            Forgot password?
          </button>
        </div>

        <PrimaryButton type="submit" disabled={isDisabled}>
          {loading ? 'Signing in…' : 'Sign in'}
        </PrimaryButton>
      </form>
    </AuthCard>
  );
}
