import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type ProductStackParamList = {
  ListProduct: undefined;
  CreateProduct: undefined;
  EditProduct: {id: string};
  CriticalReport: undefined;
  SummaryReport: undefined;
  MovementReport: undefined;
};

export type ProductListScreenProps = NativeStackScreenProps<
  ProductStackParamList,
  'ListProduct'
>;

export type ProductCreateScreenProps = NativeStackScreenProps<
  ProductStackParamList,
  'CreateProduct'
>;

export type ProductEditScreenProps = NativeStackScreenProps<
  ProductStackParamList,
  'EditProduct'
>;

export type CriticalReportScreenProps = NativeStackScreenProps<
  ProductStackParamList,
  'CriticalReport'
>;

export type SummaryReportScreenProps = NativeStackScreenProps<
  ProductStackParamList,
  'SummaryReport'
>;

export type MovementReportScreenProps = NativeStackScreenProps<
  ProductStackParamList,
  'MovementReport'
>;
