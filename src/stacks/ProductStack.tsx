import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {ProductListScreen} from '../screens/product/ProductListScreen';
import {CreateProductScreen} from '../screens/product/CreateProductScreen';
import {ProductStackParamList} from '../interfaces/IProductNavigation';
import {UpdateProductScreen} from '../screens/product/UpdateProductScreen';

const Stack = createNativeStackNavigator<ProductStackParamList>();

function ProductStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="ListProduct" component={ProductListScreen} />
      <Stack.Screen name="CreateProduct" component={CreateProductScreen} />
      <Stack.Screen name="EditProduct" component={UpdateProductScreen} />
    </Stack.Navigator>
  );
}

export default ProductStack;
