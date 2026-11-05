import type { ComponentType } from 'react';
import type { DrawerRouteName } from '../interfaces/IDrawerNavigation';
import { DashboardInputScreen } from '../screens/input/DashboardInputScreen';
import { DashboardOutputScreen } from '../screens/output/DashboardOutputScreen';
import { CriticalReportScreen } from '../screens/reports/CriticalReportScreen';
import { MovementReportScreen } from '../screens/reports/MovementReportScreen';
import { ProfitReportScreen } from '../screens/reports/ProfitReportScreen';
import { SummaryReportScreen } from '../screens/reports/SummaryReportScreen';
import InputStack from '../stacks/InputStack';
import OutputStack from '../stacks/OutputStack';
import ProductStack from '../stacks/ProductStack';

export interface DrawerRouteConfig {
  name: DrawerRouteName;
  /** Title shown in the drawer header. */
  title: string;
  component: ComponentType<object>;
  /**
   * Root screen of a nested stack. When set, the drawer header is only shown
   * while that screen is focused (see `nestedStackScreenOptions`).
   */
  nestedRootRoute?: string;
}

/** Screens registered in the main drawer, in declaration order. */
export const DRAWER_ROUTES: DrawerRouteConfig[] = [
  {
    name: 'Products',
    title: 'Productos',
    component: ProductStack,
    nestedRootRoute: 'ListProduct',
  },
  {
    name: 'Inputs',
    title: 'Entradas',
    component: InputStack,
    nestedRootRoute: 'InputList',
  },
  {
    name: 'Outputs',
    title: 'Salidas',
    component: OutputStack,
    nestedRootRoute: 'OutputList',
  },
  {
    name: 'CriticalReport',
    title: 'Reporte crítico',
    component: CriticalReportScreen,
  },
  {
    name: 'SummaryReport',
    title: 'Resumen general',
    component: SummaryReportScreen,
  },
  {
    name: 'MovementReport',
    title: 'Movimientos',
    component: MovementReportScreen,
  },
  { name: 'ProfitReport', title: 'Ganancias', component: ProfitReportScreen },
  {
    name: 'InputDashboard',
    title: 'Dashboard de entradas',
    component: DashboardInputScreen,
  },
  {
    name: 'OutputDashboard',
    title: 'Dashboard de salidas',
    component: DashboardOutputScreen,
  },
];
