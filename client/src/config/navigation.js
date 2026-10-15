import { routePaths } from '@/routes/routePaths';

/**
 * Add future authenticated navigation items here.
 * The sidebar renders this configuration without needing route/layout changes.
 */
export const navigationItems = [
  {
    label: 'Home',
    path: routePaths.home,
    icon: 'home',
  },
  {
    label: 'Chat',
    path: routePaths.chat,
    icon: 'chat',
  },
  {
    label: 'Video call',
    path: routePaths.videoCall,
    icon: 'video',
  },
];
