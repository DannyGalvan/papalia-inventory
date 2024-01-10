import {NativeStackScreenProps} from '@react-navigation/native-stack';

export type AppStackParamList = {
  Home: undefined;
  Configuration: undefined;
};

export type HomeScreenProps = NativeStackScreenProps<AppStackParamList, 'Home'>;

export type ConfigurationScreenProps = NativeStackScreenProps<
  AppStackParamList,
  'Configuration'
>;
