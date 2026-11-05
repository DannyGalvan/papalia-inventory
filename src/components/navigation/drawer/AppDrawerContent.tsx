import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { version as appVersion } from '../../../../package.json';
import { useTheme } from '../../../hooks/useTheme';
import {
  DRAWER_MENU,
  DrawerMenuSection,
  NavigableMenuItem,
} from '../../../navigation/drawerMenu';
import { selectDrawerMenuItem } from '../../../navigation/drawerMenuNavigation';
import { DrawerBrandHeader } from './DrawerBrandHeader';
import { DrawerFooter } from './DrawerFooter';
import { DrawerMenuEntry } from './DrawerMenuEntry';
import { DrawerSection } from './DrawerSection';

type Props = Pick<DrawerContentComponentProps, 'state' | 'navigation'> & {
  /** Injectable for tests; defaults to the app menu. */
  sections?: DrawerMenuSection[];
};

/** Custom drawer body: brand header, grouped menu and version footer. */
export const AppDrawerContent = ({
  state,
  navigation,
  sections = DRAWER_MENU,
}: Props) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const activeRoute = state.routes[state.index]?.name;

  const handleSelect = useCallback(
    (item: NavigableMenuItem) =>
      selectDrawerMenuItem(item, navigation, activeRoute),
    [navigation, activeRoute],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top }}
        accessibilityLabel="Menú principal"
      >
        <DrawerBrandHeader />
        {sections.map(section => (
          <DrawerSection key={section.id} title={section.title}>
            {section.items.map(item => (
              <DrawerMenuEntry
                key={item.id}
                item={item}
                activeRoute={activeRoute}
                onSelect={handleSelect}
              />
            ))}
          </DrawerSection>
        ))}
      </ScrollView>
      <DrawerFooter version={appVersion} bottomInset={insets.bottom} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
