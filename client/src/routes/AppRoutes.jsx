import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Spinner } from '@/components/ui/Spinner';
import { PublicRoute } from '@/routes/guards/PublicRoute';
import { ProtectedRoute } from '@/routes/guards/ProtectedRoute';
import { routePaths } from '@/routes/routePaths';
import { MediaProvider } from '@/context/MediaContext';

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
const ChatPage = lazy(() =>
  import('@/pages/chat/ChatPage.jsx').then((m) => ({ default: m.ChatPage })),
);
const VideoCallPage = lazy(() =>
  import('@/pages/video-call/VideoCallPage.jsx').then((m) => ({
    default: m.VideoCallPage,
  })),
);
const MainLayout = lazy(() =>
  import('@/layouts/MainLayout.jsx').then((m) => ({
    default: m.MainLayout,
  })),
);

/**
 * Top-level route configuration.
 *
 * Structure:
 *   /login, /signup  → PublicRoute guard → AuthLayout
 *   /, /chat         → ProtectedRoute guard → MediaProvider → MainLayout → page
 *   *                → Redirect to login
 *
 * MediaProvider is mounted around all protected routes so the local
 * MediaStream persists across page navigations within the app.
 * Public/auth routes do not receive the provider — they never need media.
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
          {/*
           * MediaProvider wraps all protected routes so that:
           * 1. The MediaStream is shared across VideoCallPage → (future) InCallPage.
           * 2. The stream survives navigations within the protected area.
           * 3. Auth/public routes never trigger media permission requests.
           */}
          <Route
            element={
              <MediaProvider>
                <MainLayout />
              </MediaProvider>
            }
          >
            <Route path={routePaths.home} element={<HomePage />} />
            <Route path={routePaths.chat} element={<ChatPage />} />
            <Route path={routePaths.videoCall} element={<VideoCallPage />} />
          </Route>
        </Route>

        {/* ---- Catch-all ---- */}
        <Route path="*" element={<Navigate to={routePaths.login} replace />} />
      </Routes>
    </Suspense>
  );
}
