import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider } from '@/config/firebase';
import { authService } from '@/services/authService';
import { AuthCard } from '@/components/auth/AuthCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { GoogleButton } from '@/components/ui/GoogleButton';
import { Divider } from '@/components/ui/Divider';
import { TextField } from '@/components/ui/TextField';
import { routePaths } from '@/routes/routePaths';

export function SignupPage() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
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
      // 1. Create the Firebase Auth user
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      // 2. Set displayName on the Auth profile
      await updateProfile(user, { displayName: name });

      // 3. Create user profile in Firestore via server API
      await authService.register({ name });

      // AuthListener will pick up the new user automatically.
      navigate(routePaths.home, { replace: true });
    } catch (err) {
      // Firebase Auth error codes
      const messages = {
        'auth/email-already-in-use': 'This email is already registered.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/invalid-email': 'Please enter a valid email address.',
      };
      setError(messages[err.code] || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const { user } = await signInWithPopup(auth, googleProvider);

      // Create Firestore profile — the register endpoint is idempotent,
      // so this is safe even if the user already has a profile.
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
      eyebrow="Get started"
      title="Create your account"
      description="Set up your profile and start using QuickChat in a few quick steps."
      footer={
        <p className="text-sm text-[#748278]">
          Already have an account?{' '}
          <Link
            to={routePaths.login}
            className="font-semibold text-[#5f7c58] transition hover:text-[#3f5d3b]"
          >
            Sign in
          </Link>
        </p>
      }
    >
      {/* ── Shared error display ── */}
      {error && (
        <p className="mb-4 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm font-medium text-[#b91c1c]">
          {error}
        </p>
      )}

      {/* ── Google sign-up ── */}
      <GoogleButton onClick={handleGoogleSignUp} disabled={isDisabled}>
        {googleLoading ? 'Creating account…' : 'Continue with Google'}
      </GoogleButton>

      <Divider />

      {/* ── Email / password form ── */}
      <form className="space-y-5" onSubmit={handleSubmit}>
        <TextField
          label="Full name"
          name="name"
          placeholder="Your name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
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
          placeholder="Create a strong password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <label className="flex items-start gap-3 text-sm text-[#748278]">
          <input
            type="checkbox"
            className="mt-1 rounded border-[#b8cbb5] text-[#5f7c58] focus:ring-[#6b8963]"
            required
          />
          <span>I agree to the terms and privacy policy.</span>
        </label>

        <PrimaryButton type="submit" disabled={isDisabled}>
          {loading ? 'Creating account…' : 'Create account'}
        </PrimaryButton>
      </form>
    </AuthCard>
  );
}
