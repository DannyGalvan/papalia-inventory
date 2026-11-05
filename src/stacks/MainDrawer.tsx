import { createDrawerNavigator } from '@react-navigation/drawer';
import React from 'react';
import { AppDrawerContent } from '../components/navigation/drawer/AppDrawerContent';
import { HeaderThemeButton } from '../components/navigation/HeaderThemeButton';
import { useTheme } from '../hooks/useTheme';
import { DrawerParamList } from '../interfaces/IDrawerNavigation';
import { DRAWER_ROUTES } from '../navigation/drawerRoutes';
import { nestedStackScreenOptions } from '../navigation/nestedStackScreenOptions';
import { appColors } from '../styles/globalStyles';

const Drawer = createDrawerNavigator<DrawerParamList>();

const renderHeaderRight = () => <HeaderThemeButton />;
const renderDrawerContent = (
  props: React.ComponentProps<typeof AppDrawerContent>,
) => <AppDrawerContent {...props} />;

/**
 * Main navigator shown after permissions are granted. Replaces the former
 * top tabs so screens get the full height; modules are reached from the menu.
 */
const MainDrawer = () => {
  const { theme } = useTheme();

  return (
    <Drawer.Navigator
      id={undefined}
      initialRouteName="Products"
      backBehavior="firstRoute"
      drawerContent={renderDrawerContent}
      screenOptions={{
        drawerType: 'front',
        drawerStyle: { backgroundColor: theme.colors.surface, width: 300 },
        overlayColor: 'rgba(0, 0, 0, 0.45)',
        headerStyle: { backgroundColor: theme.colors.surface },
        headerShadowVisible: false,
        headerTintColor: appColors.warning,
        headerTitleStyle: { color: appColors.warning, fontWeight: 'bold' },
        headerRight: renderHeaderRight,
      }}
    >
      {DRAWER_ROUTES.map(({ name, title, component, nestedRootRoute }) => (
        <Drawer.Screen
          key={name}
          name={name}
          component={component}
          options={
            nestedRootRoute
              ? props => ({
                  title,
                  ...nestedStackScreenOptions(nestedRootRoute)(props),
                })
              : { title }
          }
        />
      ))}
    </Drawer.Navigator>
  );
};

export default MainDrawer;
