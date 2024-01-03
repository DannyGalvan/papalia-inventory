import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {OutputListScreen} from '../screens/output/OutputListScreen';
import {OutputStackParamList} from '../interfaces/IOutputNavigation';
import {CreateOutputScreen} from '../screens/output/CreateOutputScreen';
import {ReadOutputScreen} from '../screens/output/ReadOutputScreen';
import {DashboardOutputScreen} from '../screens/output/DashboardOutputScreen';

const Stack = createNativeStackNavigator<OutputStackParamList>();

function OutputStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="OutputList" component={OutputListScreen} />
      <Stack.Screen name="CreateOutput" component={CreateOutputScreen} />
      <Stack.Screen name="ReadOutput" component={ReadOutputScreen} />
      <Stack.Screen name="DashboardOutput" component={DashboardOutputScreen} />
    </Stack.Navigator>
  );
}

export default OutputStack;
