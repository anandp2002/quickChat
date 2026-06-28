import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import { authService } from '@/services/authService';
import { AuthCard } from '@/components/auth/AuthCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { TextField } from '@/components/ui/TextField';
import { routePaths } from '@/routes/routePaths';

export function SignupPage() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
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

  return (
    <AuthCard
      eyebrow="Get started"
      title="Create your account"
      description="Set up your profile and start using QuickChat in a few quick steps."
      footer={
        <p className="text-sm text-slate-500">
          Already have an account?{' '}
          <Link
            to={routePaths.login}
            className="font-semibold text-sky-500 transition hover:text-sky-600"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </p>
        )}

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

        <label className="flex items-start gap-3 text-sm text-slate-500">
          <input
            type="checkbox"
            className="mt-1 rounded border-slate-300 text-sky-500 focus:ring-sky-500"
            required
          />
          <span>I agree to the terms and privacy policy.</span>
        </label>

        <PrimaryButton type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </PrimaryButton>
      </form>
    </AuthCard>
  );
}
