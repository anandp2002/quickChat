import { House, MessageCircle, Video } from 'lucide-react';

const iconRegistry = {
  home: House,
  chat: MessageCircle,
  video: Video,
};

export function NavigationIcon({ name }) {
  const Icon = iconRegistry[name];

  if (!Icon) return null;

  return (
    <span className="grid h-5 w-5 shrink-0 place-items-center">
      <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
    </span>
  );
}
