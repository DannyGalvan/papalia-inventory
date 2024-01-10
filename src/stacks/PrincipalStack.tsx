import React from 'react';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import ProductStack from './ProductStack';
import InputStack from './InputStack';
import OutputStack from './OutputStack';
import {appColors} from '../styles/globalStyles';

const Tab = createMaterialTopTabNavigator();

const PrincipalStack = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: appColors.secondary,
        tabBarInactiveTintColor: appColors.gray,
        tabBarLabelStyle: {fontSize: 12},
        tabBarStyle: {backgroundColor: appColors.white},
        tabBarIndicatorStyle: {backgroundColor: appColors.secondary},
      }}>
      <Tab.Screen name="Productos" component={ProductStack} />
      <Tab.Screen name="Entradas" component={InputStack} />
      <Tab.Screen name="Salidas" component={OutputStack} />
    </Tab.Navigator>
  );
};

export default PrincipalStack;
