import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/sidebar/Sidebar';

export function MainLayout() {
  return (
    <div className="block min-h-screen bg-app font-sans text-text-primary min-[701px]:flex">
      <Sidebar />
      <main className="w-full min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
