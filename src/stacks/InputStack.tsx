import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { InputStackParamList } from '../interfaces/IInputNavigation';
import { CreateInputScreen } from '../screens/input/CreateInputScreen';
import { DashboardInputScreen } from '../screens/input/DashboardInputScreen';
import { InputListScreen } from '../screens/input/InputListScreen';
import { ReadInputScreen } from '../screens/input/ReadInputScreen';
import { appColors } from '../styles/globalStyles';

const Stack = createNativeStackNavigator<InputStackParamList>();

function InputStack() {
  const {theme} = useTheme();

  return (
    <Stack.Navigator
      id={undefined}
      screenOptions={{
        headerTintColor: appColors.warning,
        headerBackTitle: 'Regresar',
        headerTitle: '',
        headerStyle: {backgroundColor: theme.colors.surface},
        headerShadowVisible: false,
      }}>
      <Stack.Screen
        name="InputList"
        component={InputListScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen name="CreateInput" component={CreateInputScreen} />
      <Stack.Screen name="ReadInput" component={ReadInputScreen} />
      <Stack.Screen name="DashboarInput" component={DashboardInputScreen} />
    </Stack.Navigator>
  );
}

export default InputStack;
