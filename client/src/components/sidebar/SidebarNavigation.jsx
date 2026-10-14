import { NavLink } from 'react-router-dom';
import { NavigationIcon } from '@/components/sidebar/NavigationIcon';
import { routePaths } from '@/routes/routePaths';

export function SidebarNavigation({ items, collapsed = false, onNavigate }) {
  return (
    <nav
      className="mt-2 flex flex-col gap-1 min-[701px]:mt-[58px] min-[701px]:grid min-[701px]:w-full min-[701px]:gap-1.5"
      aria-label="Main navigation"
    >
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === routePaths.home}
          title={item.label}
          onClick={onNavigate}
          className={({ isActive }) =>
            `relative flex min-h-11 flex-1 items-center justify-center gap-3 rounded-[10px] px-2.5 py-2.5 text-[#6e7b78] no-underline transition-[background-color,color,padding] duration-150 hover:bg-[#e7f1eb] hover:text-[#176044] min-[701px]:w-full min-[701px]:flex-none ${collapsed ? 'min-[701px]:justify-center min-[701px]:px-0' : 'min-[701px]:justify-start min-[701px]:px-3'} ${isActive ? 'bg-[#e7f1eb] text-[#176044]' : ''}`
          }
        >
          <NavigationIcon name={item.icon} />
          <span className={collapsed ? 'min-[701px]:hidden' : ''}>
            {item.label}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}
