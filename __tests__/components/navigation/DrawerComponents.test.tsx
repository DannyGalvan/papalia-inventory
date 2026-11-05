/**
 * Component tests for the drawer menu building blocks and the composed
 * AppDrawerContent.
 */

import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import React from 'react';
import { Switch, Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { AppDrawerContent } from '../../../src/components/navigation/drawer/AppDrawerContent';
import { DrawerNavItem } from '../../../src/components/navigation/drawer/DrawerNavItem';
import { DrawerThemeToggle } from '../../../src/components/navigation/drawer/DrawerThemeToggle';
import type { DrawerMenuSection } from '../../../src/navigation/drawerMenu';

jest.mock('react-native-vector-icons/Ionicons', () => {
  const { Text: RNText } = require('react-native');
  return (props: { name: string }) => <RNText {...props} />;
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockToggleTheme = jest.fn();
jest.mock('../../../src/hooks/useTheme', () => {
  const { lightTheme: theme } = require('../../../src/design-system/themes');
  return {
    useTheme: () => ({ theme, isDark: false, toggleTheme: mockToggleTheme }),
  };
});

const render = (element: React.ReactElement) => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(element);
  });
  return renderer;
};

const findButton = (
  renderer: ReactTestRenderer.ReactTestRenderer,
  label: string,
) =>
  renderer.root.find(
    node =>
      node.props.accessibilityRole === 'button' &&
      node.props.accessibilityLabel === label &&
      typeof node.props.onPress === 'function',
  );

const TEST_MENU: DrawerMenuSection[] = [
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
      { type: 'theme-toggle', id: 'theme', label: 'Tema oscuro', icon: 'moon' },
    ],
  },
];

const buildDrawerProps = (activeIndex = 0) => ({
  state: {
    index: activeIndex,
    routes: [
      { key: 'p', name: 'Products' },
      { key: 'i', name: 'Inputs' },
    ],
  } as unknown as DrawerContentComponentProps['state'],
  navigation: {
    navigate: jest.fn(),
    closeDrawer: jest.fn(),
  } as unknown as DrawerContentComponentProps['navigation'],
});

beforeEach(() => mockToggleTheme.mockClear());

describe('DrawerNavItem', () => {
  it('renders the label and icon and calls onPress', () => {
    const onPress = jest.fn();
    const renderer = render(
      <DrawerNavItem label="Entradas" icon="enter-outline" onPress={onPress} />,
    );
    const texts = renderer.root.findAllByType(Text).map(t => t.props);
    expect(texts.some(p => p.children === 'Entradas')).toBe(true);
    expect(texts.some(p => p.name === 'enter-outline')).toBe(true);

    ReactTestRenderer.act(() =>
      findButton(renderer, 'Entradas').props.onPress(),
    );
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('exposes the selected state when active', () => {
    const renderer = render(
      <DrawerNavItem
        label="Productos"
        icon="cube"
        active
        onPress={jest.fn()}
      />,
    );
    expect(findButton(renderer, 'Productos').props.accessibilityState).toEqual({
      selected: true,
    });
  });
});

describe('DrawerThemeToggle', () => {
  it('reflects the theme and toggles it', () => {
    const renderer = render(<DrawerThemeToggle label="Tema oscuro" />);
    const toggle = renderer.root.findByType(Switch);
    expect(toggle.props.value).toBe(false);

    ReactTestRenderer.act(() => toggle.props.onValueChange(true));
    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });
});

describe('AppDrawerContent', () => {
  it('renders section titles, items and the version footer', () => {
    const renderer = render(
      <AppDrawerContent {...buildDrawerProps()} sections={TEST_MENU} />,
    );
    const texts = renderer.root
      .findAllByType(Text)
      .map(t => [].concat(t.props.children).join(''));
    expect(texts).toEqual(
      expect.arrayContaining([
        'Inventario',
        'Ajustes',
        'Productos',
        'Entradas',
        'Configuración',
        'Tema oscuro',
      ]),
    );
    expect(texts.some(t => t.startsWith('Versión '))).toBe(true);
  });

  it('highlights the focused drawer route', () => {
    const renderer = render(
      <AppDrawerContent {...buildDrawerProps(1)} sections={TEST_MENU} />,
    );
    expect(findButton(renderer, 'Entradas').props.accessibilityState).toEqual({
      selected: true,
    });
    expect(findButton(renderer, 'Productos').props.accessibilityState).toEqual({
      selected: false,
    });
  });

  it('navigates when a menu entry is pressed', () => {
    const props = buildDrawerProps(0);
    const renderer = render(
      <AppDrawerContent {...props} sections={TEST_MENU} />,
    );
    ReactTestRenderer.act(() =>
      findButton(renderer, 'Configuración').props.onPress(),
    );
    expect(props.navigation.closeDrawer).toHaveBeenCalled();
    expect(props.navigation.navigate).toHaveBeenCalledWith('Configuration');
  });
});
