import React from 'react';
import { TouchableButton } from '../components/button/TouchableButton';
import {
  createNativeStackNavigator,
  NativeStackHeaderBackProps,
  NativeStackHeaderItemProps,
} from '@react-navigation/native-stack';
import PrincipalStack from './PrincipalStack';
import { appColors, appStyles } from '../styles/globalStyles';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../interfaces/IAppStartNavitgation';
import { Image, StyleSheet } from 'react-native';
import { ConfigurationScreen } from '../screens/configuration/ConfigurationScreen';
import { ProductProvider } from '../context/ProductContext';

const HeaderRight = ({}: NativeStackHeaderItemProps) => {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();

  const handleConfigurationPress = () => {
    navigation.navigate('Configuration');
  };

  return (
    <TouchableButton
      onPress={handleConfigurationPress}
      styles={{}}
      textStyle={appStyles.textWhite}
      icon="settings"
      iconColor={appColors.warning}
    />
  );
};

const HeaderLeft = ({}: NativeStackHeaderBackProps) => {
  return (
    <Image source={require('../assets/papalia.png')} style={styles.logo} />
  );
};

const Stack = createNativeStackNavigator<AppStackParamList>();

const AppStartStack = () => {
  return (
    <ProductProvider>
      <Stack.Navigator
        screenOptions={{
          headerTitleStyle: [appStyles.textWarning, appStyles.title],
          headerStyle: [appStyles.bgWhite],
        }}
        id={undefined}
        initialRouteName="Home"
      >
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
      </Stack.Navigator>
    </ProductProvider>
  );
};

const styles = StyleSheet.create({
  logo: {
    width: 150,
    height: 50,
    resizeMode: 'contain',
    marginLeft: -20,
  },
});

export default AppStartStack;
