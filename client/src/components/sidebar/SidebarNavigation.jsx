import { NavLink } from 'react-router-dom';
import { NavigationIcon } from '@/components/sidebar/NavigationIcon';
import { routePaths } from '@/routes/routePaths';

export function SidebarNavigation({ items }) {
  return (
    <nav className="app-nav" aria-label="Main navigation">
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === routePaths.home}
          title={item.label}
          className={({ isActive }) =>
            `app-nav-link${isActive ? ' is-active' : ''}`
          }
        >
          <NavigationIcon name={item.icon} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
