/**
 * Unit tests for the drawer menu selection handler.
 */

import type { NavigableMenuItem } from '../../../src/navigation/drawerMenu';
import { selectDrawerMenuItem } from '../../../src/navigation/drawerMenuNavigation';

const createNavigator = () => ({
  navigate: jest.fn(),
  closeDrawer: jest.fn(),
});

const inputsItem: NavigableMenuItem = {
  type: 'drawer-route',
  id: 'inputs',
  label: 'Entradas',
  icon: 'enter-outline',
  route: 'Inputs',
};

const configurationItem: NavigableMenuItem = {
  type: 'app-route',
  id: 'configuration',
  label: 'Configuración',
  icon: 'settings-outline',
  route: 'Configuration',
};

describe('selectDrawerMenuItem', () => {
  it('closes the drawer and jumps to a drawer route', () => {
    const navigator = createNavigator();
    selectDrawerMenuItem(inputsItem, navigator, 'Products');
    expect(navigator.closeDrawer).toHaveBeenCalledTimes(1);
    expect(navigator.navigate).toHaveBeenCalledWith('Inputs');
  });

  it('only closes the drawer when the route is already active', () => {
    const navigator = createNavigator();
    selectDrawerMenuItem(inputsItem, navigator, 'Inputs');
    expect(navigator.closeDrawer).toHaveBeenCalledTimes(1);
    expect(navigator.navigate).not.toHaveBeenCalled();
  });

  it('navigates to app routes even if a drawer route is active', () => {
    const navigator = createNavigator();
    selectDrawerMenuItem(configurationItem, navigator, 'Products');
    expect(navigator.closeDrawer).toHaveBeenCalledTimes(1);
    expect(navigator.navigate).toHaveBeenCalledWith('Configuration');
  });
});
