import { Link } from 'react-router-dom';
import { AuthCard } from '@/components/auth/AuthCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { TextField } from '@/components/ui/TextField';
import { routePaths } from '@/routes/routePaths';

export function SignupPage() {
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
      <form className="space-y-5">
        <TextField
          label="Full name"
          name="name"
          placeholder="Your name"
          autoComplete="name"
          required
        />
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
          placeholder="Create a strong password"
          autoComplete="new-password"
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

        <PrimaryButton type="submit">Create account</PrimaryButton>
      </form>
    </AuthCard>
  );
}
