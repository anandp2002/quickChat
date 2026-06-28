import { Link } from 'react-router-dom';
import { AuthCard } from '@/components/auth/AuthCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { TextField } from '@/components/ui/TextField';
import { routePaths } from '@/routes/routePaths';

export function LoginPage() {
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
      <form className="space-y-5">
        <TextField
          label="Email"
          type="email"
          name="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
        <TextField
          label="Password"
          type="password"
          name="password"
          placeholder="Enter your password"
          autoComplete="current-password"
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

        <PrimaryButton type="submit">Sign in</PrimaryButton>
      </form>
    </AuthCard>
  );
}
