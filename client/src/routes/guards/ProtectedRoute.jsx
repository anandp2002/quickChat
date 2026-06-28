import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Spinner } from '@/components/ui/Spinner';
import { routePaths } from '@/routes/routePaths';

/**
 * Route guard for authenticated-only pages.
 *
 * - Loading  → Spinner
 * - No user  → Redirect to login
 * - Has user → Render child routes
 */
export function ProtectedRoute() {
  const { user, loading } = useSelector((state) => state.auth);

  if (loading) return <Spinner />;
  if (!user) return <Navigate to={routePaths.login} replace />;

  return <Outlet />;
}
