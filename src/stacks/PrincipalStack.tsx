import React from 'react';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import ProductStack from './ProductStack';
import InputStack from './InputStack';
import OutputStack from './OutputStack';

const Tab = createMaterialTopTabNavigator();

const PrincipalStack = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Productos" component={ProductStack} />
      <Tab.Screen name="Entradas" component={InputStack} />
      <Tab.Screen name="Salidas" component={OutputStack} />
    </Tab.Navigator>
  );
};

export default PrincipalStack;
