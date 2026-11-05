import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { ProductStackParamList } from '../interfaces/IProductNavigation';
import { CreateProductScreen } from '../screens/product/CreateProductScreen';
import { ProductListScreen } from '../screens/product/ProductListScreen';
import { UpdateProductScreen } from '../screens/product/UpdateProductScreen';
import { appColors } from '../styles/globalStyles';

const Stack = createNativeStackNavigator<ProductStackParamList>();

function ProductStack() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: appColors.warning,
        headerBackTitle: 'Regresar',
        headerTitle: '',
        headerStyle: { backgroundColor: theme.colors.surface },
        headerShadowVisible: false,
      }}
      id={undefined}
    >
      <Stack.Screen
        name="ListProduct"
        component={ProductListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="CreateProduct" component={CreateProductScreen} />
      <Stack.Screen name="EditProduct" component={UpdateProductScreen} />
    </Stack.Navigator>
  );
}

export default ProductStack;
