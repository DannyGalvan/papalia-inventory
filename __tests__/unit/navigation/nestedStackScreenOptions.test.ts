/**
 * Unit tests for the drawer options applied to nested stacks.
 */

import type { ParamListBase, RouteProp } from '@react-navigation/native';
import { nestedStackScreenOptions } from '../../../src/navigation/nestedStackScreenOptions';

const routeWithFocused = (focused?: string) =>
  ({
    key: 'Products-key',
    name: 'Products',
    params: undefined,
    ...(focused
      ? {
          state: {
            index: 0,
            routes: [{ key: `${focused}-key`, name: focused }],
          },
        }
      : {}),
  } as unknown as RouteProp<ParamListBase, string>);

describe('nestedStackScreenOptions', () => {
  const options = nestedStackScreenOptions('ListProduct');

  it('shows the drawer header before the nested stack has state', () => {
    expect(options({ route: routeWithFocused() })).toEqual({
      headerShown: true,
      swipeEnabled: true,
    });
  });

  it('shows the drawer header on the stack root screen', () => {
    expect(options({ route: routeWithFocused('ListProduct') })).toEqual({
      headerShown: true,
      swipeEnabled: true,
    });
  });

  it('hides the drawer header and swipe on deeper screens', () => {
    expect(options({ route: routeWithFocused('CreateProduct') })).toEqual({
      headerShown: false,
      swipeEnabled: false,
    });
  });
});
