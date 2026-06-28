import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Spinner } from '@/components/ui/Spinner';
import { PublicRoute } from '@/routes/guards/PublicRoute';
import { ProtectedRoute } from '@/routes/guards/ProtectedRoute';
import { routePaths } from '@/routes/routePaths';

// ---------------------------------------------------------------------------
// Lazy-loaded pages
// ---------------------------------------------------------------------------
const AuthLayout = lazy(() =>
  import('@/layouts/AuthLayout.jsx').then((m) => ({ default: m.AuthLayout })),
);
const LoginPage = lazy(() =>
  import('@/pages/auth/LoginPage.jsx').then((m) => ({ default: m.LoginPage })),
);
const SignupPage = lazy(() =>
  import('@/pages/auth/SignupPage.jsx').then((m) => ({
    default: m.SignupPage,
  })),
);
const HomePage = lazy(() =>
  import('@/pages/home/HomePage.jsx').then((m) => ({ default: m.HomePage })),
);

/**
 * Top-level route configuration.
 *
 * Structure:
 *   /login, /signup  → PublicRoute guard → AuthLayout
 *   /                → ProtectedRoute guard → HomePage
 *   *                → Redirect to login
 */
export function AppRoutes() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        {/* ---- Public (guest-only) routes ---- */}
        <Route element={<PublicRoute />}>
          <Route element={<AuthLayout />}>
            <Route path={routePaths.login} element={<LoginPage />} />
            <Route path={routePaths.signup} element={<SignupPage />} />
          </Route>
        </Route>

        {/* ---- Protected routes ---- */}
        <Route element={<ProtectedRoute />}>
          <Route path={routePaths.home} element={<HomePage />} />
        </Route>

        {/* ---- Catch-all ---- */}
        <Route
          path="*"
          element={<Navigate to={routePaths.login} replace />}
        />
      </Routes>
    </Suspense>
  );
}
