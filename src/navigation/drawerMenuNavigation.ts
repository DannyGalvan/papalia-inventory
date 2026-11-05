import type { NavigableMenuItem } from './drawerMenu';

/**
 * Minimal navigation contract the drawer menu depends on. The drawer
 * navigation helpers satisfy it; tests can supply a plain fake.
 */
export interface DrawerMenuNavigator {
  navigate: (route: string) => void;
  closeDrawer: () => void;
}

/**
 * Handles a menu selection. Drawer routes are jumped to directly; app routes
 * are resolved by the parent stack because `navigate` bubbles up when the
 * drawer does not own the route.
 */
export const selectDrawerMenuItem = (
  item: NavigableMenuItem,
  navigator: DrawerMenuNavigator,
  activeRoute?: string,
): void => {
  navigator.closeDrawer();
  if (item.type === 'drawer-route' && item.route === activeRoute) {
    return;
  }
  navigator.navigate(item.route);
};
