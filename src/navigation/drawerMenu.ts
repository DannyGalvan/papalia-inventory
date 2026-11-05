import type { AppStackParamList } from '../interfaces/IAppStartNavigation';
import type { DrawerRouteName } from '../interfaces/IDrawerNavigation';

/** Root-stack screens that can be opened from the drawer (pushed over it). */
export type AppRouteName = Extract<keyof AppStackParamList, 'Configuration'>;

interface DrawerMenuItemBase {
  id: string;
  label: string;
  /** Ionicons glyph name. */
  icon: string;
}

/** Jumps to a screen owned by the drawer navigator. */
export interface DrawerRouteMenuItem extends DrawerMenuItemBase {
  type: 'drawer-route';
  route: DrawerRouteName;
}

/** Pushes a root-stack screen on top of the drawer (keeps a back button). */
export interface AppRouteMenuItem extends DrawerMenuItemBase {
  type: 'app-route';
  route: AppRouteName;
}

/** Inline light/dark theme switch. */
export interface ThemeToggleMenuItem extends DrawerMenuItemBase {
  type: 'theme-toggle';
}

export type NavigableMenuItem = DrawerRouteMenuItem | AppRouteMenuItem;
export type DrawerMenuItem = NavigableMenuItem | ThemeToggleMenuItem;

export interface DrawerMenuSection {
  id: string;
  title: string;
  items: DrawerMenuItem[];
}

/**
 * Declarative drawer menu. Adding an entry here is enough to expose a new
 * screen in the drawer; the rendering components stay untouched.
 */
export const DRAWER_MENU: DrawerMenuSection[] = [
  {
    id: 'inventory',
    title: 'Inventario',
    items: [
      {
        type: 'drawer-route',
        id: 'products',
        label: 'Productos',
        icon: 'cube-outline',
        route: 'Products',
      },
      {
        type: 'drawer-route',
        id: 'inputs',
        label: 'Entradas',
        icon: 'enter-outline',
        route: 'Inputs',
      },
      {
        type: 'drawer-route',
        id: 'outputs',
        label: 'Salidas',
        icon: 'exit-outline',
        route: 'Outputs',
      },
    ],
  },
  {
    id: 'reports',
    title: 'Reportes',
    items: [
      {
        type: 'drawer-route',
        id: 'critical-report',
        label: 'Reporte crítico',
        icon: 'warning-outline',
        route: 'CriticalReport',
      },
      {
        type: 'drawer-route',
        id: 'summary-report',
        label: 'Resumen general',
        icon: 'stats-chart-outline',
        route: 'SummaryReport',
      },
      {
        type: 'drawer-route',
        id: 'movement-report',
        label: 'Movimientos',
        icon: 'swap-horizontal-outline',
        route: 'MovementReport',
      },
      {
        type: 'drawer-route',
        id: 'profit-report',
        label: 'Ganancias',
        icon: 'cash-outline',
        route: 'ProfitReport',
      },
      {
        type: 'drawer-route',
        id: 'input-dashboard',
        label: 'Dashboard de entradas',
        icon: 'grid-outline',
        route: 'InputDashboard',
      },
      {
        type: 'drawer-route',
        id: 'output-dashboard',
        label: 'Dashboard de salidas',
        icon: 'grid-outline',
        route: 'OutputDashboard',
      },
    ],
  },
  {
    id: 'settings',
    title: 'Ajustes',
    items: [
      {
        type: 'app-route',
        id: 'configuration',
        label: 'Configuración',
        icon: 'settings-outline',
        route: 'Configuration',
      },
      {
        type: 'theme-toggle',
        id: 'theme',
        label: 'Tema oscuro',
        icon: 'moon-outline',
      },
    ],
  },
];
