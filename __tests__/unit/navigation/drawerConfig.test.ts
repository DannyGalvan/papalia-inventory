/**
 * Consistency tests between the declarative drawer menu and the routes
 * registered in the drawer navigator.
 */

import { DRAWER_MENU } from '../../../src/navigation/drawerMenu';
import { DRAWER_ROUTES } from '../../../src/navigation/drawerRoutes';

// Screens and stacks pull in the database layer; the config test only needs
// their identity, so replace them with lightweight stubs.
jest.mock('../../../src/stacks/ProductStack', () => () => null);
jest.mock('../../../src/stacks/InputStack', () => () => null);
jest.mock('../../../src/stacks/OutputStack', () => () => null);
jest.mock('../../../src/screens/input/DashboardInputScreen', () => ({
  DashboardInputScreen: () => null,
}));
jest.mock('../../../src/screens/output/DashboardOutputScreen', () => ({
  DashboardOutputScreen: () => null,
}));
jest.mock('../../../src/screens/reports/CriticalReportScreen', () => ({
  CriticalReportScreen: () => null,
}));
jest.mock('../../../src/screens/reports/MovementReportScreen', () => ({
  MovementReportScreen: () => null,
}));
jest.mock('../../../src/screens/reports/ProfitReportScreen', () => ({
  ProfitReportScreen: () => null,
}));
jest.mock('../../../src/screens/reports/SummaryReportScreen', () => ({
  SummaryReportScreen: () => null,
}));

const menuItems = DRAWER_MENU.flatMap(section => section.items);
const registeredRoutes = DRAWER_ROUTES.map(route => route.name);

describe('drawer configuration', () => {
  it('registers every drawer route exactly once', () => {
    expect(new Set(registeredRoutes).size).toBe(registeredRoutes.length);
  });

  it('uses unique ids for sections and items', () => {
    const sectionIds = DRAWER_MENU.map(section => section.id);
    const itemIds = menuItems.map(item => item.id);
    expect(new Set(sectionIds).size).toBe(sectionIds.length);
    expect(new Set(itemIds).size).toBe(itemIds.length);
  });

  it('only links menu entries to registered drawer routes', () => {
    menuItems
      .filter(item => item.type === 'drawer-route')
      .forEach(item => {
        expect(registeredRoutes).toContain((item as { route: string }).route);
      });
  });

  it('exposes every registered drawer route in the menu', () => {
    const linkedRoutes = menuItems
      .filter(item => item.type === 'drawer-route')
      .map(item => (item as { route: string }).route);
    registeredRoutes.forEach(route => expect(linkedRoutes).toContain(route));
  });

  it('starts with the inventory modules as nested stacks', () => {
    expect(DRAWER_ROUTES.slice(0, 3)).toEqual([
      expect.objectContaining({
        name: 'Products',
        nestedRootRoute: 'ListProduct',
      }),
      expect.objectContaining({ name: 'Inputs', nestedRootRoute: 'InputList' }),
      expect.objectContaining({
        name: 'Outputs',
        nestedRootRoute: 'OutputList',
      }),
    ]);
  });

  it('includes the configuration entry and the theme toggle', () => {
    expect(menuItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'app-route', route: 'Configuration' }),
        expect.objectContaining({ type: 'theme-toggle' }),
      ]),
    );
  });
});
