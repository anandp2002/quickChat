import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Spinner } from '@/components/ui/Spinner';
import { routePaths } from '@/routes/routePaths';

/**
 * Route guard for guest-only pages (login, signup).
 *
 * - Loading  → Spinner
 * - Has user → Redirect to chat (already logged in)
 * - No user  → Render child routes
 */
export function PublicRoute() {
  const { user, loading } = useSelector((state) => state.auth);

  if (loading) return <Spinner />;
  if (user) return <Navigate to={routePaths.home} replace />;

  return <Outlet />;
}
