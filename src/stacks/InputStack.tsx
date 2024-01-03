import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {InputListScreen} from '../screens/intput/InputListScreen';
import {InputStackParamList} from '../interfaces/IInputNavigation';
import {CreateInputScreen} from '../screens/intput/CreateInputScreen';
import {ReadInputScreen} from '../screens/intput/ReadInputScreen';
import {DashboardInputScreen} from '../screens/intput/DashboardInputScreen';

const Stack = createNativeStackNavigator<InputStackParamList>();

function InputStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="InputList" component={InputListScreen} />
      <Stack.Screen name="CreateInput" component={CreateInputScreen} />
      <Stack.Screen name="ReadInput" component={ReadInputScreen} />
      <Stack.Screen name="DashboarInput" component={DashboardInputScreen} />
    </Stack.Navigator>
  );
}

export default InputStack;
