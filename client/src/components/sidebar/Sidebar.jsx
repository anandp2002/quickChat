import { useSelector } from 'react-redux';
import { navigationItems } from '@/config/navigation';
import { SidebarAccount } from '@/components/sidebar/SidebarAccount';
import { SidebarBrand } from '@/components/sidebar/SidebarBrand';
import { SidebarNavigation } from '@/components/sidebar/SidebarNavigation';

export function Sidebar() {
  const user = useSelector((state) => state.auth.user);

  return (
    <aside className="app-sidebar">
      <SidebarBrand />
      <SidebarNavigation items={navigationItems} />
      <SidebarAccount user={user} />
    </aside>
  );
}
