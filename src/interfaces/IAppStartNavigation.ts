import {NativeStackScreenProps} from '@react-navigation/native-stack';

export type AppStackParamList = {
  Permissions: undefined;
  Home: undefined;
  Configuration: undefined;
  MovementTypeCatalog: undefined;
};

export type PermissionsScreenProps = NativeStackScreenProps<AppStackParamList, 'Permissions'>;
export type HomeScreenProps = NativeStackScreenProps<AppStackParamList, 'Home'>;
export type ConfigurationScreenProps = NativeStackScreenProps<AppStackParamList, 'Configuration'>;
export type MovementTypeCatalogScreenProps = NativeStackScreenProps<AppStackParamList, 'MovementTypeCatalog'>;
