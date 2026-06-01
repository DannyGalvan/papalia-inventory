import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { HeaderLeft } from '../components/navigation/HeaderLeft';
import { HeaderRight } from '../components/navigation/HeaderRight';
import { ProductProvider } from '../context/ProductContext';
import { useTheme } from '../hooks/useTheme';
import { AppStackParamList } from '../interfaces/IAppStartNavigation';
import { CategoryCatalogScreen } from '../screens/catalog/CategoryCatalogScreen';
import { MovementTypeCatalogScreen } from '../screens/catalog/MovementTypeCatalogScreen';
import { SupplierCatalogScreen } from '../screens/catalog/SupplierCatalogScreen';
import { UnitOfMeasureCatalogScreen } from '../screens/catalog/UnitOfMeasureCatalogScreen';
import { ConfigurationScreen } from '../screens/configuration/ConfigurationScreen';
import { PermissionsScreen } from '../screens/permissions/PermissionsScreen';
import { appColors } from '../styles/globalStyles';
import PrincipalStack from './PrincipalStack';

const Stack = createNativeStackNavigator<AppStackParamList>();

const AppStartStack = () => {
  const {theme} = useTheme();

  return (
    <ProductProvider>
      <Stack.Navigator
        screenOptions={{
          headerTitleStyle: {color: appColors.warning, fontWeight: 'bold'},
          headerStyle: {backgroundColor: theme.colors.surface},
        }}
        id={undefined}
        initialRouteName="Permissions">
        <Stack.Screen
          name="Permissions"
          component={PermissionsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Home"
          component={PrincipalStack}
          options={{
            headerTitle: '',
            headerRight: HeaderRight,
            headerLeft: HeaderLeft,
          }}
        />
        <Stack.Screen
          name="Configuration"
          options={{
            headerTitle: 'Regresar',
            headerTintColor: appColors.warning,
          }}
          component={ConfigurationScreen}
        />
        <Stack.Screen
          name="MovementTypeCatalog"
          options={{headerTitle: 'Regresar', headerTintColor: appColors.warning}}
          component={MovementTypeCatalogScreen}
        />
        <Stack.Screen
          name="CategoryCatalog"
          options={{headerTitle: 'Regresar', headerTintColor: appColors.warning}}
          component={CategoryCatalogScreen}
        />
        <Stack.Screen
          name="SupplierCatalog"
          options={{headerTitle: 'Regresar', headerTintColor: appColors.warning}}
          component={SupplierCatalogScreen}
        />
        <Stack.Screen
          name="UnitOfMeasureCatalog"
          options={{headerTitle: 'Regresar', headerTintColor: appColors.warning}}
          component={UnitOfMeasureCatalogScreen}
        />
      </Stack.Navigator>
    </ProductProvider>
  );
};

export default AppStartStack;
