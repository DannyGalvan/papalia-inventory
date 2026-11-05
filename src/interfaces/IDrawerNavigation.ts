import type { NavigatorScreenParams } from '@react-navigation/native';
import type { InputStackParamList } from './IInputNavigation';
import type { OutputStackParamList } from './IOutputNavigation';
import type { ProductStackParamList } from './IProductNavigation';

/**
 * Routes owned by the main drawer navigator.
 *
 * Inventory modules are nested stacks (list -> create/detail); reports and
 * dashboards are leaf screens reachable directly from the drawer menu.
 */
export type DrawerParamList = {
  Products: NavigatorScreenParams<ProductStackParamList> | undefined;
  Inputs: NavigatorScreenParams<InputStackParamList> | undefined;
  Outputs: NavigatorScreenParams<OutputStackParamList> | undefined;
  CriticalReport: undefined;
  SummaryReport: undefined;
  MovementReport: undefined;
  ProfitReport: undefined;
  InputDashboard: undefined;
  OutputDashboard: undefined;
};

export type DrawerRouteName = keyof DrawerParamList;
