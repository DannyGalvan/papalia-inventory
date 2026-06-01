import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { ProductStackParamList } from '../interfaces/IProductNavigation';
import { CreateProductScreen } from '../screens/product/CreateProductScreen';
import { ProductListScreen } from '../screens/product/ProductListScreen';
import { UpdateProductScreen } from '../screens/product/UpdateProductScreen';
import { CriticalReportScreen } from '../screens/reports/CriticalReportScreen';
import { MovementReportScreen } from '../screens/reports/MovementReportScreen';
import { SummaryReportScreen } from '../screens/reports/SummaryReportScreen';
import { appColors } from '../styles/globalStyles';

const Stack = createNativeStackNavigator<ProductStackParamList>();

function ProductStack() {
  const {theme} = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: appColors.warning,
        headerBackTitle: 'Regresar',
        headerTitle: '',
        headerStyle: {backgroundColor: theme.colors.surface},
        headerShadowVisible: false,
      }}
      id={undefined}>
      <Stack.Screen
        name="ListProduct"
        component={ProductListScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen name="CreateProduct" component={CreateProductScreen} />
      <Stack.Screen name="EditProduct" component={UpdateProductScreen} />
      <Stack.Screen name="CriticalReport" component={CriticalReportScreen} />
      <Stack.Screen name="SummaryReport" component={SummaryReportScreen} />
      <Stack.Screen name="MovementReport" component={MovementReportScreen} />
    </Stack.Navigator>
  );
}

export default ProductStack;
