import React from 'react';
import type {
  DrawerMenuItem,
  NavigableMenuItem,
} from '../../../navigation/drawerMenu';
import { DrawerNavItem } from './DrawerNavItem';
import { DrawerThemeToggle } from './DrawerThemeToggle';

interface Props {
  item: DrawerMenuItem;
  activeRoute?: string;
  onSelect: (item: NavigableMenuItem) => void;
}

/** Maps a declarative menu item to the component that renders its type. */
export const DrawerMenuEntry = ({ item, activeRoute, onSelect }: Props) => {
  if (item.type === 'theme-toggle') {
    return <DrawerThemeToggle label={item.label} />;
  }

  return (
    <DrawerNavItem
      label={item.label}
      icon={item.icon}
      active={item.type === 'drawer-route' && item.route === activeRoute}
      onPress={() => onSelect(item)}
    />
  );
};
