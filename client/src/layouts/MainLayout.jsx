import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/sidebar/Sidebar';

export function MainLayout() {
  return (
    <div className="block h-[calc(100vh-68px)] overflow-hidden bg-app font-sans text-text-primary min-[701px]:flex min-[701px]:h-screen">
      <Sidebar />
      <main className="h-full w-full min-w-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
