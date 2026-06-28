import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Spinner } from '@/components/ui/Spinner';
import { PublicRoute } from '@/routes/guards/PublicRoute';
import { routePaths } from '@/routes/routePaths';

// ---------------------------------------------------------------------------
// Lazy-loaded layouts & pages
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

// ---------------------------------------------------------------------------
// Future protected routes — uncomment when ready:
//
// import { ProtectedRoute } from '@/routes/guards/ProtectedRoute';
//
// const ChatLayout = lazy(() =>
//   import('@/layouts/ChatLayout.jsx').then(m => ({ default: m.ChatLayout })),
// );
// const ChatPage = lazy(() =>
//   import('@/pages/chat/ChatPage.jsx').then(m => ({ default: m.ChatPage })),
// );
// ---------------------------------------------------------------------------

/**
 * Top-level route configuration.
 *
 * Structure:
 *   /login, /signup  → PublicRoute guard → AuthLayout
 *   /chat            → ProtectedRoute guard → ChatLayout (future)
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

        {/* ---- Protected routes (future) ---- */}
        {/*
        <Route element={<ProtectedRoute />}>
          <Route element={<ChatLayout />}>
            <Route path={routePaths.chat} element={<ChatPage />} />
          </Route>
        </Route>
        */}

        {/* ---- Catch-all ---- */}
        <Route
          path="*"
          element={<Navigate to={routePaths.login} replace />}
        />
      </Routes>
    </Suspense>
  );
}
