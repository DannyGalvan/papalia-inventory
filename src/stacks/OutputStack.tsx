import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { OutputStackParamList } from '../interfaces/IOutputNavigation';
import { CreateOutputScreen } from '../screens/output/CreateOutputScreen';
import { DashboardOutputScreen } from '../screens/output/DashboardOutputScreen';
import { OutputListScreen } from '../screens/output/OutputListScreen';
import { ReadOutputScreen } from '../screens/output/ReadOutputScreen';
import { appColors } from '../styles/globalStyles';

const Stack = createNativeStackNavigator<OutputStackParamList>();

function OutputStack() {
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
        name="OutputList"
        component={OutputListScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen name="CreateOutput" component={CreateOutputScreen} />
      <Stack.Screen name="ReadOutput" component={ReadOutputScreen} />
      <Stack.Screen name="DashboardOutput" component={DashboardOutputScreen} />
    </Stack.Navigator>
  );
}

export default OutputStack;
