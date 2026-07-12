export interface NavigationItem {
  label: string;
  path: string;
  icon: string;
}

export const navigationItems: NavigationItem[] = [
  { label: 'Home', path: '/', icon: 'home' },
  { label: 'Tasks', path: '/tasks', icon: 'check_circle' },
  { label: 'Notes', path: '/notes', icon: 'notes' },
  { label: 'Calendar', path: '/calendar', icon: 'calendar_month' },
  { label: 'Settings', path: '/settings', icon: 'settings' },
];
