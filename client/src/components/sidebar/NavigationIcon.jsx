import { House, MessageCircle } from 'lucide-react';

const iconRegistry = {
  home: House,
  chat: MessageCircle,
};

export function NavigationIcon({ name }) {
  const Icon = iconRegistry[name];

  if (!Icon) return null;

  return (
    <span className="app-nav-icon">
      <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
    </span>
  );
}
