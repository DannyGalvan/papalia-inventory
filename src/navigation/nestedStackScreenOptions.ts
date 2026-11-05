import {
  getFocusedRouteNameFromRoute,
  ParamListBase,
  RouteProp,
} from '@react-navigation/native';

export interface NestedStackDrawerOptions {
  headerShown: boolean;
  swipeEnabled: boolean;
}

/**
 * Builds drawer screen options for a nested stack.
 *
 * On the stack's root screen the drawer header (hamburger + title) is shown
 * and the edge swipe opens the drawer. On deeper screens (create, detail) the
 * stack's own header with the back button takes over, so the drawer header is
 * hidden to avoid a double header and the swipe is disabled so it does not
 * fight the back gesture.
 */
export const nestedStackScreenOptions =
  (rootRouteName: string) =>
  ({
    route,
  }: {
    route: RouteProp<ParamListBase, string>;
  }): NestedStackDrawerOptions => {
    const focused = getFocusedRouteNameFromRoute(route) ?? rootRouteName;
    const isAtRoot = focused === rootRouteName;
    return { headerShown: isAtRoot, swipeEnabled: isAtRoot };
  };
